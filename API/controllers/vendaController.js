import pool from "../config/db.js";
import { auditar } from "../services/auditoriaService.js";
import { criarNotificacao } from "../services/notificacaoService.js";

const FORMAS = new Set([
  "dinheiro",
  "mpesa",
  "emola",
  "cartao",
  "transferencia",
  "credito",
]);
const dinheiro = (valor) => Math.round(Number(valor) * 100) / 100;

export async function criarVenda(req, res) {
  const connection = await pool.getConnection();
  try {
    const empresaId = req.user.empresa_id;
    const {
      itens,
      cliente_id = null,
      cliente_nome = null,
      desconto = 0,
      forma_pagamento,
      valor_recebido = null,
    } = req.body;
    const idempotenciaId = req.body.idempotencia_id || null;
    const vendaOffline = req.body.venda_offline === true;
    if (idempotenciaId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotenciaId))
      return res.status(400).json({ sucesso: false, erro: "Identificador da venda inválido." });
    if (vendaOffline && !idempotenciaId)
      return res.status(400).json({ sucesso: false, erro: "A venda offline precisa de um identificador único." });
    const pagamentosRecebidos = Array.isArray(req.body.pagamentos)
      ? req.body.pagamentos
      : [{ forma: forma_pagamento, valor: null, valor_recebido }];
    if (!Array.isArray(itens) || !itens.length)
      return res
        .status(400)
        .json({ sucesso: false, erro: "Adicione pelo menos um produto." });
    if (
      !pagamentosRecebidos.length ||
      pagamentosRecebidos.some((pagamento) => !FORMAS.has(pagamento.forma))
    )
      return res
        .status(400)
        .json({ sucesso: false, erro: "Forma de pagamento inválida." });
    let pendenteOffline = req.offlinePending || null;
    if (vendaOffline && idempotenciaId && !pendenteOffline) {
      const [[pendente]] = await pool.query(
        "SELECT id, usuario_id, motivo FROM VendaOfflinePendente WHERE empresa_id=? AND idempotencia_id=? AND estado='pendente'",
        [req.user.empresa_id, idempotenciaId],
      );
      pendenteOffline = pendente || null;
    }
    if (req.body.reprocessar_revisao && !pendenteOffline)
      return res.status(404).json({ sucesso: false, erro: "Venda offline pendente não encontrada." });
    if (pendenteOffline && !req.body.reprocessar_revisao)
      return res.status(202).json({
        sucesso: true,
        requer_revisao: true,
        idempotencia_id: idempotenciaId,
        erro: pendenteOffline.motivo,
      });
    if (req.body.reprocessar_revisao && !["admin", "gestor"].includes(req.user.role))
      return res.status(403).json({ sucesso: false, erro: "Apenas um gestor ou administrador pode reprocessar esta venda." });
    const usuarioVendaId = pendenteOffline?.usuario_id || req.user.id;
    if (
      pagamentosRecebidos.some((pagamento) => pagamento.forma === "credito") &&
      !cliente_id
    )
      return res
        .status(400)
        .json({
          sucesso: false,
          erro: "Selecione um cliente para utilizar crédito.",
        });
    const normalizados = itens.map((item) => ({
      produtoId: Number(item.produto_id),
      apresentacaoId: item.apresentacao_id
        ? Number(item.apresentacao_id)
        : null,
      quantidade: Number(item.quantidade),
      precoEsperado: item.preco_esperado == null ? null : Number(item.preco_esperado),
    }));
    if (
      normalizados.some(
        (item) =>
          !Number.isInteger(item.produtoId) ||
          !Number.isInteger(item.quantidade) ||
          item.quantidade <= 0 ||
          (vendaOffline && item.precoEsperado !== null && (!Number.isFinite(item.precoEsperado) || item.precoEsperado < 0)),
      )
    )
      return res
        .status(400)
        .json({ sucesso: false, erro: "Existem itens inválidos na venda." });

    await connection.beginTransaction();
    if (idempotenciaId) {
      const [[existente]] = await connection.query(
        "SELECT id, numero, subtotal, desconto, total FROM Venda WHERE empresa_id=? AND idempotencia_id=? FOR UPDATE",
        [empresaId, idempotenciaId],
      );
      if (existente) {
        await connection.rollback();
        return res.status(200).json({ sucesso: true, venda: existente, duplicada: true });
      }
    }
    const [[caixa]] = await connection.query(
      "SELECT id, usuario_id FROM CaixaSessao WHERE empresa_id = ? AND estado = 'aberto' AND DATE(aberto_em) = CURRENT_DATE() ORDER BY id DESC LIMIT 1 FOR UPDATE",
      [empresaId],
    );
    if (!caixa)
      throw Object.assign(
        new Error("Abra o caixa de hoje antes de realizar a primeira venda."),
        { status: 409, revisaoOffline: vendaOffline },
      );
    const chaves = new Set(
      normalizados.map(
        (item) => `${item.produtoId}:${item.apresentacaoId || "base"}`,
      ),
    );
    if (chaves.size !== normalizados.length)
      throw Object.assign(
        new Error("A mesma apresentação aparece mais de uma vez no carrinho."),
        { status: 400 },
      );
    const ids = [...new Set(normalizados.map((item) => item.produtoId))];
    const placeholders = ids.map(() => "?").join(",");
    const [produtos] = await connection.query(
      `SELECT id, nome, quantidade, preco, precoFornecedor, unidade_base FROM Produto WHERE empresa_id = ? AND arquivado_em IS NULL AND id IN (${placeholders}) FOR UPDATE`,
      [empresaId, ...ids],
    );
    if (produtos.length !== ids.length)
      throw Object.assign(new Error("Um dos produtos não existe."), {
        status: 404,
        revisaoOffline: vendaOffline,
      });
    const [apresentacoes] = await connection.query(
      `SELECT pa.* FROM ProdutoApresentacao pa INNER JOIN Produto p ON p.id=pa.produto_id WHERE p.empresa_id=? AND pa.produto_id IN (${placeholders}) AND pa.ativa=TRUE AND pa.vendavel=TRUE`,
      [empresaId, ...ids],
    );
    const detalhes = normalizados.map((item) => {
      const produto = produtos.find((p) => Number(p.id) === item.produtoId);
      const apresentacao = item.apresentacaoId
        ? apresentacoes.find(
            (p) =>
              Number(p.id) === item.apresentacaoId &&
              Number(p.produto_id) === item.produtoId,
          )
        : null;
      if (item.apresentacaoId && !apresentacao)
        throw Object.assign(
          new Error(
            `A apresentação selecionada para ${produto.nome} não existe.`,
          ),
          { status: 400, revisaoOffline: vendaOffline },
        );
      const fator = apresentacao ? Number(apresentacao.fator_conversao) : 1;
      const quantidadeBase = item.quantidade * fator;
      if (quantidadeBase > Number(produto.quantidade))
        throw Object.assign(
          new Error(
            `Stock insuficiente para ${produto.nome}. Disponível: ${produto.quantidade} unidade(s) base.`,
          ),
          { status: 409, revisaoOffline: vendaOffline },
        );
      const precoCatalogo = dinheiro(apresentacao?.preco ?? produto.preco);
      if (vendaOffline && !req.body.reprocessar_revisao && item.precoEsperado !== null && dinheiro(item.precoEsperado) !== precoCatalogo)
        throw Object.assign(
          new Error(`O preço de ${produto.nome} mudou desde a última atualização. Revise a venda.`),
          { status: 409, revisaoOffline: true },
        );
      const preco = req.body.reprocessar_revisao && item.precoEsperado !== null
        ? dinheiro(item.precoEsperado)
        : precoCatalogo;
      const custo = dinheiro(apresentacao?.custo ?? produto.precoFornecedor);
      return {
        ...item,
        produto,
        apresentacao,
        fator,
        quantidadeBase,
        preco,
        custo,
        precoBase: dinheiro(preco / fator),
        custoBase: dinheiro(custo / fator),
        total: dinheiro(item.quantidade * preco),
      };
    });
    for (const produto of produtos) {
      const solicitado = detalhes
        .filter((item) => item.produtoId === Number(produto.id))
        .reduce((total, item) => total + item.quantidadeBase, 0);
      if (solicitado > Number(produto.quantidade))
        throw Object.assign(
          new Error(
            `Stock insuficiente para ${produto.nome}. Disponível: ${produto.quantidade} unidade(s) base.`,
          ),
          { status: 409, revisaoOffline: vendaOffline },
        );
    }
    const subtotal = dinheiro(
      detalhes.reduce((soma, item) => soma + item.total, 0),
    );
    const descontoFinal = dinheiro(desconto);
    if (descontoFinal < 0 || descontoFinal > subtotal)
      throw Object.assign(new Error("Desconto inválido."), {
        status: 400,
        revisaoOffline: vendaOffline,
      });
    const total = dinheiro(subtotal - descontoFinal);
    const pagamentosNormalizados = pagamentosRecebidos.map((pagamento) => {
      const valor = dinheiro(pagamento.valor == null ? total : pagamento.valor);
      const recebido =
        pagamento.forma === "dinheiro"
          ? dinheiro(pagamento.valor_recebido ?? valor)
          : valor;
      if (
        !Number.isFinite(valor) ||
        valor <= 0 ||
        !Number.isFinite(recebido) ||
        recebido < valor
      )
        throw Object.assign(
          new Error("Existe um pagamento com valor inválido."),
          { status: 400 },
        );
      return {
        forma: pagamento.forma,
        valor,
        recebido,
        troco: pagamento.forma === "dinheiro" ? dinheiro(recebido - valor) : 0,
      };
    });
    const totalPago = dinheiro(
      pagamentosNormalizados.reduce(
        (soma, pagamento) => soma + pagamento.valor,
        0,
      ),
    );
    if (Math.abs(totalPago - total) > 0.009)
      throw Object.assign(
        new Error(`Os pagamentos devem totalizar ${total.toFixed(2)} MZN.`),
        { status: 400 },
      );
    const nomeAvulso =
      typeof cliente_nome === "string" ? cliente_nome.trim() : "";
    if (nomeAvulso.length > 255)
      throw Object.assign(
        new Error("O nome do cliente deve ter no máximo 255 caracteres."),
        { status: 400 },
      );
    let clienteNomeFinal = nomeAvulso || null;
    if (cliente_id) {
      const [[cliente]] = await connection.query(
        "SELECT id, nome FROM Cliente WHERE id = ? AND empresa_id = ?",
        [cliente_id, empresaId],
      );
      if (!cliente)
        throw Object.assign(new Error("Cliente não encontrado."), {
          status: 404,
          revisaoOffline: vendaOffline,
        });
      clienteNomeFinal = cliente.nome;
    }
    const [[sequencia]] = await connection.query(
      "SELECT COALESCE(MAX(numero), 0) + 1 AS numero FROM Venda WHERE empresa_id = ? FOR UPDATE",
      [empresaId],
    );
    const [vendaResult] = await connection.execute(
      "INSERT INTO Venda (empresa_id, cliente_id, cliente_nome, usuario_id, caixa_sessao_id, numero, idempotencia_id, subtotal, desconto, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        empresaId,
        cliente_id || null,
        clienteNomeFinal,
        usuarioVendaId,
        caixa?.id || null,
        sequencia.numero,
        idempotenciaId,
        subtotal,
        descontoFinal,
        total,
      ],
    );
    for (const item of detalhes) {
      await connection.execute(
        `INSERT INTO VendaItem (venda_id,produto_id,nome_produto,quantidade,preco_unitario,custo_unitario,total,apresentacao_id,apresentacao_nome,fator_conversao,quantidade_base) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [
          vendaResult.insertId,
          item.produtoId,
          item.produto.nome,
          item.quantidade,
          item.preco,
          item.custo,
          item.total,
          item.apresentacaoId,
          item.apresentacao?.nome || item.produto.unidade_base || "Unidade",
          item.fator,
          item.quantidadeBase,
        ],
      );
      await connection.execute(
        "UPDATE Produto SET quantidade=quantidade-? WHERE id=? AND empresa_id=?",
        [item.quantidadeBase, item.produtoId, empresaId],
      );
      await connection.execute(
        "INSERT INTO Movimentos (id_Produto,empresa_id,tipo,quantidade,preco_unitario,custo_unitario,origem,motivo,venda_id) VALUES (?,?,'saida',?,?,?,'venda',?,?)",
        [
          item.produtoId,
          empresaId,
          item.quantidadeBase,
          item.precoBase,
          item.custoBase,
          `Venda em ${item.apresentacao?.nome || item.produto.unidade_base || "Unidade"}`,
          vendaResult.insertId,
        ],
      );
    }
    for (const pagamento of pagamentosNormalizados)
      await connection.execute(
        "INSERT INTO PagamentoVenda (venda_id, forma, valor, valor_recebido, troco) VALUES (?, ?, ?, ?, ?)",
        [
          vendaResult.insertId,
          pagamento.forma,
          pagamento.valor,
          pagamento.recebido,
          pagamento.troco,
        ],
      );
    if (pendenteOffline) {
      await connection.execute(
        "UPDATE VendaOfflinePendente SET estado='resolvida',venda_id=? WHERE id=? AND empresa_id=? AND estado='pendente'",
        [vendaResult.insertId, pendenteOffline.id, empresaId],
      );
    }
    await connection.commit();
    await auditar({
      empresaId,
      usuarioId: req.user.id,
      acao: "criar",
      entidade: "venda",
      entidadeId: vendaResult.insertId,
      detalhes: { numero: sequencia.numero, total },
    });
    const troco = dinheiro(
      pagamentosNormalizados.reduce(
        (soma, pagamento) => soma + pagamento.troco,
        0,
      ),
    );
    return res
      .status(201)
      .json({
        sucesso: true,
        venda: {
          id: vendaResult.insertId,
          numero: sequencia.numero,
          subtotal,
          desconto: descontoFinal,
          total,
          troco,
        },
      });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY" && req.body.idempotencia_id) {
      const [[existente]] = await pool.query(
        "SELECT id, numero, subtotal, desconto, total FROM Venda WHERE empresa_id=? AND idempotencia_id=?",
        [req.user.empresa_id, req.body.idempotencia_id],
      );
      if (existente)
        return res.status(200).json({ sucesso: true, venda: existente, duplicada: true });
    }
    if (error.revisaoOffline && req.body.venda_offline === true && req.body.idempotencia_id) {
      const [resultado] = await pool.execute(
        `INSERT INTO VendaOfflinePendente (empresa_id,usuario_id,idempotencia_id,payload,motivo)
         VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE motivo=VALUES(motivo),updated_at=CURRENT_TIMESTAMP`,
        [
          req.user.empresa_id,
          req.offlinePending?.usuario_id || req.user.id,
          req.body.idempotencia_id,
          JSON.stringify(req.body),
          error.message,
        ],
      );
      if (resultado.affectedRows === 1) {
        void criarNotificacao({
          empresaId: req.user.empresa_id,
          tipo: "venda_offline_revisao",
          titulo: "Venda offline precisa de revisão",
          mensagem: "Uma venda offline precisa de revisão. Consulte o histórico de vendas.",
        }).catch((erroNotificacao) => console.error("Falha ao notificar venda offline:", erroNotificacao));
      }
      return res.status(202).json({
        sucesso: true,
        requer_revisao: true,
        idempotencia_id: req.body.idempotencia_id,
        erro: error.message,
      });
    }
    return res
      .status(error.status || 500)
      .json({
        sucesso: false,
        erro: error.status
          ? error.message
          : "Não foi possível concluir a venda.",
      });
  } finally {
    connection.release();
  }
}

export async function listarVendas(req, res) {
  const [vendas] = await pool.query(
    `SELECT v.id, v.numero, CONCAT('VEN-',YEAR(v.created_at),'-',LPAD(v.numero,6,'0')) AS codigo, v.estado, v.subtotal, v.desconto, v.total, COALESCE(d.valor_devolvido,0) AS valor_devolvido, v.total-COALESCE(d.valor_devolvido,0) AS total_liquido, v.created_at, COALESCE(v.cliente_nome, c.nome) AS cliente, u.nome AS operador, (SELECT GROUP_CONCAT(DISTINCT p.forma ORDER BY p.forma SEPARATOR ',') FROM PagamentoVenda p WHERE p.venda_id=v.id) AS forma_pagamento, COUNT(DISTINCT vi.id) AS itens FROM Venda v LEFT JOIN (SELECT vi.venda_id, ROUND(SUM(vi.total * vi.quantidade_devolvida / NULLIF(vi.quantidade,0) * v2.total / NULLIF(v2.subtotal,0)),2) AS valor_devolvido FROM VendaItem vi INNER JOIN Venda v2 ON v2.id=vi.venda_id GROUP BY vi.venda_id) d ON d.venda_id=v.id LEFT JOIN Cliente c ON c.id=v.cliente_id INNER JOIN Usuario u ON u.id=v.usuario_id LEFT JOIN VendaItem vi ON vi.venda_id=v.id WHERE v.empresa_id=? GROUP BY v.id ORDER BY v.created_at DESC`,
    [req.user.empresa_id],
  );
  return res.json({ sucesso: true, vendas });
}

export async function listarVendasOfflinePendentes(req, res) {
  const [pendentes] = await pool.query(
    `SELECT p.id,p.idempotencia_id,p.payload,p.motivo,p.created_at,u.nome AS operador
     FROM VendaOfflinePendente p
     INNER JOIN Usuario u ON u.id=p.usuario_id AND u.empresa_id=p.empresa_id
     WHERE p.empresa_id=? AND p.estado='pendente'
     ORDER BY p.created_at ASC`,
    [req.user.empresa_id],
  );
  return res.json({
    sucesso: true,
    pendentes: pendentes.map((pendente) => ({
      ...pendente,
      payload: typeof pendente.payload === "string"
        ? JSON.parse(pendente.payload)
        : pendente.payload,
    })),
  });
}

export async function reprocessarVendaOffline(req, res) {
  if (!["admin", "gestor"].includes(req.user.role))
    return res.status(403).json({ sucesso: false, erro: "Apenas um gestor ou administrador pode reprocessar esta venda." });
  const [[pendente]] = await pool.query(
    "SELECT * FROM VendaOfflinePendente WHERE id=? AND empresa_id=? AND estado='pendente'",
    [req.params.id, req.user.empresa_id],
  );
  if (!pendente)
    return res.status(404).json({ sucesso: false, erro: "Venda offline pendente não encontrada." });

  req.offlinePending = pendente;
  const payload = typeof pendente.payload === "string"
    ? JSON.parse(pendente.payload)
    : pendente.payload;
  req.body = {
    ...payload,
    idempotencia_id: pendente.idempotencia_id,
    venda_offline: true,
    reprocessar_revisao: true,
  };
  return criarVenda(req, res);
}

export async function obterEstadoVendaOffline(req, res) {
  const { idempotenciaId } = req.params;
  const [[venda]] = await pool.query(
    "SELECT id,numero FROM Venda WHERE empresa_id=? AND idempotencia_id=?",
    [req.user.empresa_id, idempotenciaId],
  );
  if (venda) return res.json({ sucesso: true, estado: "sincronizada", venda });
  const [[pendente]] = await pool.query(
    "SELECT motivo FROM VendaOfflinePendente WHERE empresa_id=? AND idempotencia_id=? AND estado='pendente'",
    [req.user.empresa_id, idempotenciaId],
  );
  if (pendente)
    return res.json({ sucesso: true, estado: "revisao", erro: pendente.motivo });
  return res.status(404).json({ sucesso: false, estado: "desconhecida" });
}

export async function obterVenda(req, res) {
  const [[venda]] = await pool.query(
    `SELECT v.*, CONCAT('VEN-',YEAR(v.created_at),'-',LPAD(v.numero,6,'0')) AS codigo, COALESCE(v.cliente_nome, c.nome) AS cliente, c.nuit AS cliente_nuit, c.telefone AS cliente_telefone, u.nome AS operador, e.nome AS empresa_nome, e.nuit AS empresa_nuit, e.email AS empresa_email, e.telefone AS empresa_telefone, e.endereco AS empresa_endereco FROM Venda v INNER JOIN Empresa e ON e.id=v.empresa_id LEFT JOIN Cliente c ON c.id=v.cliente_id INNER JOIN Usuario u ON u.id=v.usuario_id WHERE v.id=? AND v.empresa_id=?`,
    [req.params.id, req.user.empresa_id],
  );
  if (!venda)
    return res
      .status(404)
      .json({ sucesso: false, erro: "Venda não encontrada." });
  const [itens] = await pool.query(
    "SELECT * FROM VendaItem WHERE venda_id = ? ORDER BY id",
    [venda.id],
  );
  const [pagamentos] = await pool.query(
    "SELECT id, forma, valor, valor_recebido, troco FROM PagamentoVenda WHERE venda_id = ? ORDER BY id",
    [venda.id],
  );
  return res.json({
    sucesso: true,
    venda: {
      ...venda,
      forma_pagamento: pagamentos.map((pagamento) => pagamento.forma).join(","),
      valor_recebido: pagamentos.reduce(
        (soma, pagamento) => soma + Number(pagamento.valor_recebido || 0),
        0,
      ),
      troco: pagamentos.reduce(
        (soma, pagamento) => soma + Number(pagamento.troco || 0),
        0,
      ),
      pagamentos,
      itens,
    },
  });
}

export async function cancelarVenda(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[venda]] = await connection.query(
      "SELECT * FROM Venda WHERE id=? AND empresa_id=? FOR UPDATE",
      [req.params.id, req.user.empresa_id],
    );
    if (!venda)
      throw Object.assign(new Error("Venda não encontrada."), { status: 404 });
    if (venda.estado !== "concluida")
      throw Object.assign(
        new Error("Somente vendas concluídas podem ser canceladas."),
        { status: 409 },
      );
    const [itens] = await connection.query(
      "SELECT * FROM VendaItem WHERE venda_id=?",
      [venda.id],
    );
    for (const item of itens) {
      const quantidadeBase = Number(item.quantidade_base || item.quantidade);
      await connection.execute(
        "UPDATE Produto SET quantidade=quantidade+? WHERE id=? AND empresa_id=?",
        [quantidadeBase, item.produto_id, req.user.empresa_id],
      );
      await connection.execute(
        "INSERT INTO Movimentos (id_Produto, empresa_id, tipo, quantidade, preco_unitario, custo_unitario, origem, motivo, venda_id) VALUES (?, ?, 'entrada', ?, ?, ?, 'cancelamento', 'Cancelamento de venda', ?)",
        [
          item.produto_id,
          req.user.empresa_id,
          quantidadeBase,
          dinheiro(item.preco_unitario / Number(item.fator_conversao || 1)),
          dinheiro(item.custo_unitario / Number(item.fator_conversao || 1)),
          venda.id,
        ],
      );
    }
    await connection.execute(
      "UPDATE Venda SET estado='cancelada', cancelada_em=CURRENT_TIMESTAMP WHERE id=?",
      [venda.id],
    );
    await connection.commit();
    return res.json({
      sucesso: true,
      mensagem: "Venda cancelada e stock reposto.",
    });
  } catch (error) {
    await connection.rollback();
    return res
      .status(error.status || 500)
      .json({
        sucesso: false,
        erro: error.status
          ? error.message
          : "Não foi possível cancelar a venda.",
      });
  } finally {
    connection.release();
  }
}

export async function devolverItem(req, res) {
  const connection = await pool.getConnection();
  try {
    const quantidade = Number(req.body.quantidade);
    if (!Number.isInteger(quantidade) || quantidade <= 0)
      return res
        .status(400)
        .json({ sucesso: false, erro: "Quantidade de devolução inválida." });
    await connection.beginTransaction();
    const [[venda]] = await connection.query(
      "SELECT id, estado FROM Venda WHERE id=? AND empresa_id=? FOR UPDATE",
      [req.params.id, req.user.empresa_id],
    );
    if (!venda || venda.estado === "cancelada")
      throw Object.assign(new Error("Venda não disponível para devolução."), {
        status: 409,
      });
    const [[item]] = await connection.query(
      "SELECT * FROM VendaItem WHERE id=? AND venda_id=? FOR UPDATE",
      [req.params.itemId, venda.id],
    );
    if (!item)
      throw Object.assign(new Error("Item não encontrado."), { status: 404 });
    const restante =
      Number(item.quantidade) - Number(item.quantidade_devolvida);
    if (quantidade > restante)
      throw Object.assign(
        new Error(`Só é possível devolver ${restante} unidade(s).`),
        { status: 409 },
      );
    await connection.execute(
      "UPDATE VendaItem SET quantidade_devolvida=quantidade_devolvida+? WHERE id=?",
      [quantidade, item.id],
    );
    const quantidadeBase = quantidade * Number(item.fator_conversao || 1);
    await connection.execute(
      "UPDATE Produto SET quantidade=quantidade+? WHERE id=? AND empresa_id=?",
      [quantidadeBase, item.produto_id, req.user.empresa_id],
    );
    await connection.execute(
      "INSERT INTO Movimentos (id_Produto,empresa_id,tipo,quantidade,preco_unitario,custo_unitario,origem,motivo,venda_id) VALUES (?,?,'entrada',?,?,?,'devolucao','Devolução de cliente',?)",
      [
        item.produto_id,
        req.user.empresa_id,
        quantidadeBase,
        dinheiro(item.preco_unitario / Number(item.fator_conversao || 1)),
        dinheiro(item.custo_unitario / Number(item.fator_conversao || 1)),
        venda.id,
      ],
    );
    const [[resumo]] = await connection.query(
      "SELECT SUM(quantidade) AS total, SUM(quantidade_devolvida) AS devolvido FROM VendaItem WHERE venda_id=?",
      [venda.id],
    );
    const estado =
      Number(resumo.total) === Number(resumo.devolvido)
        ? "devolvida"
        : "parcialmente_devolvida";
    await connection.execute("UPDATE Venda SET estado=? WHERE id=?", [
      estado,
      venda.id,
    ]);
    await connection.commit();
    return res.json({
      sucesso: true,
      mensagem: "Devolução registada e stock reposto.",
    });
  } catch (error) {
    await connection.rollback();
    return res
      .status(error.status || 500)
      .json({
        sucesso: false,
        erro: error.status
          ? error.message
          : "Não foi possível registar a devolução.",
      });
  } finally {
    connection.release();
  }
}

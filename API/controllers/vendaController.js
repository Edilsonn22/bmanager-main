import pool from "../config/db.js";
import { auditar } from "../services/auditoriaService.js";

const FORMAS = new Set(["dinheiro", "mpesa", "emola", "cartao", "transferencia", "credito"]);
const dinheiro = (valor) => Math.round(Number(valor) * 100) / 100;

export async function criarVenda(req, res) {
  const connection = await pool.getConnection();
  try {
    const empresaId = req.user.empresa_id;
    const { itens, cliente_id = null, cliente_nome = null, desconto = 0, forma_pagamento, valor_recebido = null } = req.body;
    if (!Array.isArray(itens) || !itens.length) return res.status(400).json({ sucesso: false, erro: "Adicione pelo menos um produto." });
    if (!FORMAS.has(forma_pagamento)) return res.status(400).json({ sucesso: false, erro: "Forma de pagamento inválida." });
    if (forma_pagamento === "credito" && !cliente_id) return res.status(400).json({ sucesso: false, erro: "Selecione um cliente para uma venda a crédito." });
    const normalizados = itens.map((item) => ({ produtoId: Number(item.produto_id), apresentacaoId: item.apresentacao_id ? Number(item.apresentacao_id) : null, quantidade: Number(item.quantidade) }));
    if (normalizados.some((item) => !Number.isInteger(item.produtoId) || !Number.isInteger(item.quantidade) || item.quantidade <= 0)) return res.status(400).json({ sucesso: false, erro: "Existem itens inválidos na venda." });

    await connection.beginTransaction();
    const [[caixa]] = await connection.query("SELECT id, usuario_id FROM CaixaSessao WHERE empresa_id = ? AND estado = 'aberto' ORDER BY id DESC LIMIT 1 FOR UPDATE", [empresaId]);
    if (!caixa) throw Object.assign(new Error("Abra o caixa antes de realizar uma venda."), { status: 409 });
    const chaves = new Set(normalizados.map((item) => `${item.produtoId}:${item.apresentacaoId || "base"}`));
    if (chaves.size !== normalizados.length) throw Object.assign(new Error("A mesma apresentação aparece mais de uma vez no carrinho."), { status: 400 });
    const ids = [...new Set(normalizados.map((item) => item.produtoId))];
    const placeholders = ids.map(() => "?").join(",");
    const [produtos] = await connection.query(`SELECT id, nome, quantidade, preco, precoFornecedor, unidade_base FROM Produto WHERE empresa_id = ? AND arquivado_em IS NULL AND id IN (${placeholders}) FOR UPDATE`, [empresaId, ...ids]);
    if (produtos.length !== ids.length) throw Object.assign(new Error("Um dos produtos não existe."), { status: 404 });
    const [apresentacoes] = await connection.query(`SELECT pa.* FROM ProdutoApresentacao pa INNER JOIN Produto p ON p.id=pa.produto_id WHERE p.empresa_id=? AND pa.produto_id IN (${placeholders}) AND pa.ativa=TRUE AND pa.vendavel=TRUE`, [empresaId, ...ids]);
    const detalhes = normalizados.map((item) => {
      const produto = produtos.find((p) => Number(p.id) === item.produtoId);
      const apresentacao = item.apresentacaoId ? apresentacoes.find((p) => Number(p.id) === item.apresentacaoId && Number(p.produto_id) === item.produtoId) : null;
      if (item.apresentacaoId && !apresentacao) throw Object.assign(new Error(`A apresentação selecionada para ${produto.nome} não existe.`), { status: 400 });
      const fator = apresentacao ? Number(apresentacao.fator_conversao) : 1;
      const quantidadeBase = item.quantidade * fator;
      if (quantidadeBase > Number(produto.quantidade)) throw Object.assign(new Error(`Stock insuficiente para ${produto.nome}. Disponível: ${produto.quantidade} unidade(s) base.`), { status: 409 });
      const preco = dinheiro(apresentacao?.preco ?? produto.preco);
      const custo = dinheiro(apresentacao?.custo ?? produto.precoFornecedor);
      return { ...item, produto, apresentacao, fator, quantidadeBase, preco, custo, precoBase: dinheiro(preco / fator), custoBase: dinheiro(custo / fator), total: dinheiro(item.quantidade * preco) };
    });
    for (const produto of produtos) {
      const solicitado = detalhes.filter((item) => item.produtoId === Number(produto.id)).reduce((total, item) => total + item.quantidadeBase, 0);
      if (solicitado > Number(produto.quantidade)) throw Object.assign(new Error(`Stock insuficiente para ${produto.nome}. Disponível: ${produto.quantidade} unidade(s) base.`), { status: 409 });
    }
    const subtotal = dinheiro(detalhes.reduce((soma, item) => soma + item.total, 0));
    const descontoFinal = dinheiro(desconto);
    if (descontoFinal < 0 || descontoFinal > subtotal) throw Object.assign(new Error("Desconto inválido."), { status: 400 });
    const total = dinheiro(subtotal - descontoFinal);
    if (forma_pagamento === "dinheiro" && Number(valor_recebido) < total) throw Object.assign(new Error("O valor recebido é inferior ao total."), { status: 400 });
    const nomeAvulso = typeof cliente_nome === "string" ? cliente_nome.trim() : "";
    if (nomeAvulso.length > 255) throw Object.assign(new Error("O nome do cliente deve ter no máximo 255 caracteres."), { status: 400 });
    let clienteNomeFinal = nomeAvulso || null;
    if (cliente_id) {
      const [[cliente]] = await connection.query("SELECT id, nome FROM Cliente WHERE id = ? AND empresa_id = ?", [cliente_id, empresaId]);
      if (!cliente) throw Object.assign(new Error("Cliente não encontrado."), { status: 404 });
      clienteNomeFinal = cliente.nome;
    }
    const [[sequencia]] = await connection.query("SELECT COALESCE(MAX(numero), 0) + 1 AS numero FROM Venda WHERE empresa_id = ? FOR UPDATE", [empresaId]);
    const [vendaResult] = await connection.execute("INSERT INTO Venda (empresa_id, cliente_id, cliente_nome, usuario_id, caixa_sessao_id, numero, subtotal, desconto, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [empresaId, cliente_id || null, clienteNomeFinal, req.user.id, caixa?.id || null, sequencia.numero, subtotal, descontoFinal, total]);
    for (const item of detalhes) {
      await connection.execute(`INSERT INTO VendaItem (venda_id,produto_id,nome_produto,quantidade,preco_unitario,custo_unitario,total,apresentacao_id,apresentacao_nome,fator_conversao,quantidade_base) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [vendaResult.insertId, item.produtoId, item.produto.nome, item.quantidade, item.preco, item.custo, item.total, item.apresentacaoId, item.apresentacao?.nome || item.produto.unidade_base || "Unidade", item.fator, item.quantidadeBase]);
      await connection.execute("UPDATE Produto SET quantidade=quantidade-? WHERE id=? AND empresa_id=?", [item.quantidadeBase, item.produtoId, empresaId]);
      await connection.execute("INSERT INTO Movimentos (id_Produto,empresa_id,tipo,quantidade,preco_unitario,custo_unitario,origem,motivo,venda_id) VALUES (?,?,'saida',?,?,?,'venda',?,?)", [item.produtoId, empresaId, item.quantidadeBase, item.precoBase, item.custoBase, `Venda em ${item.apresentacao?.nome || item.produto.unidade_base || "Unidade"}`, vendaResult.insertId]);
    }
    const recebido = forma_pagamento === "dinheiro" ? dinheiro(valor_recebido) : total;
    const troco = forma_pagamento === "dinheiro" ? dinheiro(recebido - total) : 0;
    await connection.execute("INSERT INTO PagamentoVenda (venda_id, forma, valor, valor_recebido, troco) VALUES (?, ?, ?, ?, ?)", [vendaResult.insertId, forma_pagamento, total, recebido, troco]);
    await connection.commit();
    await auditar({ empresaId, usuarioId: req.user.id, acao: "criar", entidade: "venda", entidadeId: vendaResult.insertId, detalhes: { numero: sequencia.numero, total } });
    return res.status(201).json({ sucesso: true, venda: { id: vendaResult.insertId, numero: sequencia.numero, subtotal, desconto: descontoFinal, total, troco } });
  } catch (error) {
    await connection.rollback();
    return res.status(error.status || 500).json({ sucesso: false, erro: error.status ? error.message : "Não foi possível concluir a venda." });
  } finally { connection.release(); }
}

export async function listarVendas(req, res) {
  const [vendas] = await pool.query(`SELECT v.id, v.numero, v.estado, v.subtotal, v.desconto, v.total, v.created_at, COALESCE(v.cliente_nome, c.nome) AS cliente, u.nome AS operador, p.forma AS forma_pagamento, COUNT(vi.id) AS itens FROM Venda v LEFT JOIN Cliente c ON c.id=v.cliente_id INNER JOIN Usuario u ON u.id=v.usuario_id LEFT JOIN PagamentoVenda p ON p.venda_id=v.id LEFT JOIN VendaItem vi ON vi.venda_id=v.id WHERE v.empresa_id=? GROUP BY v.id, p.id ORDER BY v.created_at DESC`, [req.user.empresa_id]);
  return res.json({ sucesso: true, vendas });
}

export async function obterVenda(req, res) {
  const [[venda]] = await pool.query(`SELECT v.*, COALESCE(v.cliente_nome, c.nome) AS cliente, c.nuit AS cliente_nuit, c.telefone AS cliente_telefone, u.nome AS operador, p.forma AS forma_pagamento, p.valor_recebido, p.troco, e.nome AS empresa_nome, e.nuit AS empresa_nuit, e.email AS empresa_email, e.telefone AS empresa_telefone, e.endereco AS empresa_endereco FROM Venda v INNER JOIN Empresa e ON e.id=v.empresa_id LEFT JOIN Cliente c ON c.id=v.cliente_id INNER JOIN Usuario u ON u.id=v.usuario_id LEFT JOIN PagamentoVenda p ON p.venda_id=v.id WHERE v.id=? AND v.empresa_id=?`, [req.params.id, req.user.empresa_id]);
  if (!venda) return res.status(404).json({ sucesso: false, erro: "Venda não encontrada." });
  const [itens] = await pool.query("SELECT * FROM VendaItem WHERE venda_id = ? ORDER BY id", [venda.id]);
  return res.json({ sucesso: true, venda: { ...venda, itens } });
}

export async function cancelarVenda(req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[venda]] = await connection.query("SELECT * FROM Venda WHERE id=? AND empresa_id=? FOR UPDATE", [req.params.id, req.user.empresa_id]);
    if (!venda) throw Object.assign(new Error("Venda não encontrada."), { status: 404 });
    if (venda.estado !== "concluida") throw Object.assign(new Error("Somente vendas concluídas podem ser canceladas."), { status: 409 });
    const [itens] = await connection.query("SELECT * FROM VendaItem WHERE venda_id=?", [venda.id]);
    for (const item of itens) {
      const quantidadeBase = Number(item.quantidade_base || item.quantidade);
      await connection.execute("UPDATE Produto SET quantidade=quantidade+? WHERE id=? AND empresa_id=?", [quantidadeBase, item.produto_id, req.user.empresa_id]);
      await connection.execute("INSERT INTO Movimentos (id_Produto, empresa_id, tipo, quantidade, preco_unitario, custo_unitario, origem, motivo, venda_id) VALUES (?, ?, 'entrada', ?, ?, ?, 'cancelamento', 'Cancelamento de venda', ?)", [item.produto_id, req.user.empresa_id, quantidadeBase, dinheiro(item.preco_unitario / Number(item.fator_conversao || 1)), dinheiro(item.custo_unitario / Number(item.fator_conversao || 1)), venda.id]);
    }
    await connection.execute("UPDATE Venda SET estado='cancelada', cancelada_em=CURRENT_TIMESTAMP WHERE id=?", [venda.id]);
    await connection.commit();
    return res.json({ sucesso: true, mensagem: "Venda cancelada e stock reposto." });
  } catch (error) { await connection.rollback(); return res.status(error.status || 500).json({ sucesso: false, erro: error.status ? error.message : "Não foi possível cancelar a venda." }); }
  finally { connection.release(); }
}

export async function devolverItem(req, res) {
  const connection = await pool.getConnection();
  try {
    const quantidade = Number(req.body.quantidade);
    if (!Number.isInteger(quantidade) || quantidade <= 0) return res.status(400).json({ sucesso: false, erro: "Quantidade de devolução inválida." });
    await connection.beginTransaction();
    const [[venda]] = await connection.query("SELECT id, estado FROM Venda WHERE id=? AND empresa_id=? FOR UPDATE", [req.params.id, req.user.empresa_id]);
    if (!venda || venda.estado === "cancelada") throw Object.assign(new Error("Venda não disponível para devolução."), { status: 409 });
    const [[item]] = await connection.query("SELECT * FROM VendaItem WHERE id=? AND venda_id=? FOR UPDATE", [req.params.itemId, venda.id]);
    if (!item) throw Object.assign(new Error("Item não encontrado."), { status: 404 });
    const restante = Number(item.quantidade) - Number(item.quantidade_devolvida);
    if (quantidade > restante) throw Object.assign(new Error(`Só é possível devolver ${restante} unidade(s).`), { status: 409 });
    await connection.execute("UPDATE VendaItem SET quantidade_devolvida=quantidade_devolvida+? WHERE id=?", [quantidade, item.id]);
    const quantidadeBase = quantidade * Number(item.fator_conversao || 1);
    await connection.execute("UPDATE Produto SET quantidade=quantidade+? WHERE id=? AND empresa_id=?", [quantidadeBase, item.produto_id, req.user.empresa_id]);
    await connection.execute("INSERT INTO Movimentos (id_Produto,empresa_id,tipo,quantidade,preco_unitario,custo_unitario,origem,motivo,venda_id) VALUES (?,?,'entrada',?,?,?,'devolucao','Devolução de cliente',?)", [item.produto_id, req.user.empresa_id, quantidadeBase, dinheiro(item.preco_unitario / Number(item.fator_conversao || 1)), dinheiro(item.custo_unitario / Number(item.fator_conversao || 1)), venda.id]);
    const [[resumo]] = await connection.query("SELECT SUM(quantidade) AS total, SUM(quantidade_devolvida) AS devolvido FROM VendaItem WHERE venda_id=?", [venda.id]);
    const estado = Number(resumo.total) === Number(resumo.devolvido) ? "devolvida" : "parcialmente_devolvida";
    await connection.execute("UPDATE Venda SET estado=? WHERE id=?", [estado, venda.id]);
    await connection.commit();
    return res.json({ sucesso: true, mensagem: "Devolução registada e stock reposto." });
  } catch (error) {
    await connection.rollback();
    return res.status(error.status || 500).json({ sucesso: false, erro: error.status ? error.message : "Não foi possível registar a devolução." });
  } finally { connection.release(); }
}

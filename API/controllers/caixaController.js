import pool from "../config/db.js";

export async function obterCaixa(req, res) {
  const [[caixa]] = await pool.query(
    "SELECT cs.*, u.nome AS operador, (cs.estado='aberto' AND DATE(cs.aberto_em)=CURRENT_DATE()) AS aberto_hoje FROM CaixaSessao cs INNER JOIN Usuario u ON u.id=cs.usuario_id WHERE cs.empresa_id=? ORDER BY cs.id DESC LIMIT 1",
    [req.user.empresa_id],
  );
  let totais = { total: 0, dinheiro: 0, vendas: 0 };
  if (caixa) {
    [[totais]] = await pool.query(
      "SELECT COALESCE(SUM(CASE WHEN v.estado!='cancelada' THEN p.valor ELSE 0 END),0) total, COALESCE(SUM(CASE WHEN v.estado!='cancelada' AND p.forma='dinheiro' THEN p.valor ELSE 0 END),0) dinheiro, COUNT(DISTINCT CASE WHEN v.estado!='cancelada' THEN v.id END) vendas FROM Venda v INNER JOIN PagamentoVenda p ON p.venda_id=v.id WHERE v.caixa_sessao_id=?",
      [caixa.id],
    );
  }
  res.json({ sucesso: true, caixa: caixa || null, totais });
}

export async function listarRelatoriosCaixa(req, res) {
  const [operacoes] = await pool.query(
    `SELECT cs.id, YEAR(cs.aberto_em) AS ano_abertura, cs.estado,
      cs.valor_abertura, cs.aberto_em, cs.valor_fecho, cs.fechado_em,
      u.nome AS operador, uf.nome AS fechado_por,
      r.codigo AS codigo_fecho, r.resumo AS resumo_fecho
     FROM CaixaSessao cs
     INNER JOIN Usuario u ON u.id=cs.usuario_id AND u.empresa_id=cs.empresa_id
     LEFT JOIN CaixaFechoRelatorio r
       ON r.caixa_sessao_id=cs.id AND r.empresa_id=cs.empresa_id
     LEFT JOIN Usuario uf ON uf.id=r.usuario_fecho_id AND uf.empresa_id=cs.empresa_id
     WHERE cs.empresa_id=?
     ORDER BY cs.aberto_em DESC, cs.id DESC
     LIMIT 50`,
    [req.user.empresa_id],
  );
  return res.json({
    sucesso: true,
    operacoes: operacoes.map((operacao) => ({
      ...operacao,
      codigo_abertura: `CA-${operacao.ano_abertura}-${String(operacao.id).padStart(6, "0")}`,
      resumo_fecho: typeof operacao.resumo_fecho === "string"
        ? JSON.parse(operacao.resumo_fecho)
        : operacao.resumo_fecho,
    })),
  });
}

export async function abrirCaixa(req, res) {
  const valor = Number(req.body.valor_abertura || 0);
  if (!Number.isFinite(valor) || valor < 0) return res.status(400).json({ sucesso: false, erro: "Valor de abertura inválido." });
  try {
    const [[aberto]] = await pool.query(
      "SELECT id, aberto_em, DATE(aberto_em)=CURRENT_DATE() AS aberto_hoje FROM CaixaSessao WHERE empresa_id=? AND estado='aberto'",
      [req.user.empresa_id],
    );
    if (aberto) {
      return res.status(409).json({ sucesso: false, erro: aberto.aberto_hoje ? "Já existe um caixa aberto hoje." : "Existe um caixa de um dia anterior por fechar. Feche-o antes de iniciar o caixa de hoje." });
    }
    const [result] = await pool.execute("INSERT INTO CaixaSessao (empresa_id,usuario_id,valor_abertura) VALUES (?,?,?)", [req.user.empresa_id, req.user.id, valor]);
    return res.status(201).json({ sucesso: true, id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") return res.status(409).json({ sucesso: false, erro: "Já existe um caixa aberto." });
    throw error;
  }
}

export async function fecharCaixa(req, res) {
  const valor = Number(req.body.valor_fecho);
  if (!Number.isFinite(valor) || valor < 0) return res.status(400).json({ sucesso: false, erro: "Informe o valor contado no caixa." });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[caixa]] = await connection.query(
      `SELECT cs.id,cs.usuario_id,cs.valor_abertura,cs.aberto_em,u.nome operador FROM CaixaSessao cs
       INNER JOIN Usuario u ON u.id=cs.usuario_id WHERE cs.id=? AND cs.empresa_id=? AND cs.estado='aberto' FOR UPDATE`,
      [req.params.id, req.user.empresa_id],
    );
    if (!caixa) { await connection.rollback(); return res.status(404).json({ sucesso: false, erro: "Caixa aberto não encontrado." }); }
    if (Number(caixa.usuario_id) !== Number(req.user.id) && !["admin", "gestor"].includes(req.user.role)) {
      await connection.rollback();
      return res.status(403).json({ sucesso: false, erro: "Apenas quem abriu o caixa, um gestor ou um administrador pode fechá-lo." });
    }

    const [pagamentos] = await connection.query(
      "SELECT p.forma,COALESCE(SUM(p.valor),0) valor FROM Venda v INNER JOIN PagamentoVenda p ON p.venda_id=v.id WHERE v.caixa_sessao_id=? AND v.estado!='cancelada' GROUP BY p.forma ORDER BY p.forma",
      [caixa.id],
    );
    const [[vendas]] = await connection.query(
      `SELECT COUNT(*) quantidade,COALESCE(SUM(v.subtotal),0) subtotal,COALESCE(SUM(v.desconto),0) descontos,COALESCE(SUM(v.total),0) total_original,COALESCE(SUM(COALESCE(d.valor_devolvido,0)),0) devolucoes,COALESCE(SUM(v.total-COALESCE(d.valor_devolvido,0)),0) total FROM Venda v LEFT JOIN (SELECT vi.venda_id,ROUND(SUM(vi.total*vi.quantidade_devolvida/NULLIF(vi.quantidade,0)*v2.total/NULLIF(v2.subtotal,0)),2) valor_devolvido FROM VendaItem vi INNER JOIN Venda v2 ON v2.id=vi.venda_id GROUP BY vi.venda_id) d ON d.venda_id=v.id WHERE v.caixa_sessao_id=? AND v.estado!='cancelada'`,
      [caixa.id],
    );
    const [[cancelamentos]] = await connection.query(
      "SELECT COUNT(*) quantidade,COALESCE(SUM(total),0) valor FROM Venda WHERE caixa_sessao_id=? AND estado='cancelada'",
      [caixa.id],
    );
    const [[artigos]] = await connection.query(
      "SELECT COALESCE(SUM(vi.quantidade),0) vendidos,COALESCE(SUM(vi.quantidade_devolvida),0) devolvidos FROM VendaItem vi INNER JOIN Venda v ON v.id=vi.venda_id WHERE v.caixa_sessao_id=? AND v.estado!='cancelada'",
      [caixa.id],
    );
    const [[empresa]] = await connection.query("SELECT nome,nuit,email,telefone,endereco FROM Empresa WHERE id=?", [req.user.empresa_id]);
    const [[responsavel]] = await connection.query("SELECT nome FROM Usuario WHERE id=?", [req.user.id]);

    const conferidos = req.body.valores_conferidos || {};
    const metodos = pagamentos.map((pagamento) => {
      const abertura = pagamento.forma === "dinheiro" ? Number(caixa.valor_abertura) : 0;
      const esperado = abertura + Number(pagamento.valor);
      const informado = Number(conferidos[pagamento.forma]);
      const contado = pagamento.forma === "dinheiro" ? valor : Number.isFinite(informado) ? informado : esperado;
      return { forma: pagamento.forma, abertura, recebido: Number(pagamento.valor), esperado, contado, diferenca: Math.round((contado - esperado) * 100) / 100 };
    });
    if (!metodos.some((metodo) => metodo.forma === "dinheiro")) {
      const abertura = Number(caixa.valor_abertura);
      metodos.unshift({ forma: "dinheiro", abertura, recebido: 0, esperado: abertura, contado: valor, diferenca: Math.round((valor - abertura) * 100) / 100 });
    }

    const dinheiro = metodos.find((metodo) => metodo.forma === "dinheiro");
    const codigo = `FC-${new Date().getFullYear()}-${String(caixa.id).padStart(6, "0")}`;
    const fechadoEm = new Date();
    const resumo = {
      codigo, empresa,
      caixa: { id: caixa.id, aberto_em: caixa.aberto_em, fechado_em: fechadoEm, operador: caixa.operador, fechado_por: responsavel?.nome || req.user.nome },
      vendas: {
        quantidade: Number(vendas.quantidade), artigos: Number(artigos.vendidos), devolvidos: Number(artigos.devolvidos),
        subtotal: Number(vendas.subtotal), descontos: Number(vendas.descontos), devolucoes: Number(vendas.devolucoes), total_original: Number(vendas.total_original), total: Number(vendas.total),
        canceladas: Number(cancelamentos.quantidade), valor_cancelado: Number(cancelamentos.valor),
      },
      metodos,
    };

    await connection.execute("UPDATE CaixaSessao SET estado='fechado',valor_fecho=?,fechado_em=? WHERE id=?", [valor, fechadoEm, caixa.id]);
    await connection.execute(
      "INSERT INTO CaixaFechoRelatorio (caixa_sessao_id,empresa_id,usuario_fecho_id,codigo,resumo) VALUES (?,?,?,?,?)",
      [caixa.id, req.user.empresa_id, req.user.id, codigo, JSON.stringify(resumo)],
    );
    await connection.commit();
    return res.json({ sucesso: true, fecho: { esperado: dinheiro.esperado, contado: valor, diferenca: dinheiro.diferenca }, relatorio: resumo });
  } catch (error) {
    await connection.rollback();
    return res.status(500).json({ sucesso: false, erro: error.message || "Não foi possível fechar o caixa." });
  } finally {
    connection.release();
  }
}

export async function obterRelatorioFecho(req, res) {
  const [[relatorio]] = await pool.query("SELECT resumo FROM CaixaFechoRelatorio WHERE caixa_sessao_id=? AND empresa_id=?", [req.params.id, req.user.empresa_id]);
  if (!relatorio) return res.status(404).json({ sucesso: false, erro: "Relatório de fecho não encontrado." });
  return res.json({ sucesso: true, relatorio: typeof relatorio.resumo === "string" ? JSON.parse(relatorio.resumo) : relatorio.resumo });
}

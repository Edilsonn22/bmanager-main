import pool from "../config/db.js";
import { limiteFoiAtingido } from "../services/assinaturaService.js";
import { auditar } from "../services/auditoriaService.js";

const empresaDoPedido = (req) => req.user?.empresa_id;
const texto = (valor, limite = 255) => typeof valor === "string" ? valor.trim().slice(0, limite) : "";

async function relacoesPertencemAEmpresa(empresaId, idCategoria, idFornecedor, connection = pool) {
  const [[categoria], [fornecedor]] = await Promise.all([
    connection.query("SELECT id FROM Categoria WHERE id = ? AND empresa_id = ?", [idCategoria, empresaId]),
    connection.query("SELECT id FROM Fornecedor WHERE id = ? AND empresa_id = ?", [idFornecedor, empresaId]),
  ]);
  return categoria.length > 0 && fornecedor.length > 0;
}

function normalizarProduto(body) {
  const tipoProduto = body.tipo_produto === "multiplas" ? "multiplas" : "simples";
  const produto = {
    nome: texto(body.nome), idCategoria: Number(body.idCategoria), idFornecedor: Number(body.idFornecedor),
    precoFornecedor: Number(body.precoFornecedor), preco: Number(body.preco), quantidade: Number(body.quantidade),
    codigoBarras: texto(body.codigo_barras, 100) || null, tipoProduto,
    unidadeBase: texto(body.unidade_base, 50) || "Unidade",
  };
  if (!produto.nome || !Number.isInteger(produto.idCategoria) || !Number.isInteger(produto.idFornecedor)
    || !Number.isFinite(produto.precoFornecedor) || produto.precoFornecedor <= 0
    || !Number.isFinite(produto.preco) || produto.preco <= 0
    || !Number.isInteger(produto.quantidade) || produto.quantidade < 0) {
    throw Object.assign(new Error("Preencha todos os campos com valores válidos."), { status: 400 });
  }
  let apresentacao = null;
  if (tipoProduto === "multiplas") {
    const origem = body.apresentacao || {};
    apresentacao = {
      nome: texto(origem.nome, 50), fator: Number(origem.fator_conversao),
      preco: Number(origem.preco), custo: Number(origem.custo),
      codigoBarras: texto(origem.codigo_barras, 100) || null,
      vendavel: origem.vendavel !== false,
    };
    if (!apresentacao.nome || apresentacao.nome.toLowerCase() === produto.unidadeBase.toLowerCase()
      || !Number.isInteger(apresentacao.fator) || apresentacao.fator <= 1
      || (apresentacao.vendavel && (!Number.isFinite(apresentacao.preco) || apresentacao.preco <= 0))
      || !Number.isFinite(apresentacao.custo) || apresentacao.custo <= 0) {
      throw Object.assign(new Error("Informe uma embalagem válida, com fator maior que 1 e preços positivos."), { status: 400 });
    }
    if (!apresentacao.vendavel && (!Number.isFinite(apresentacao.preco) || apresentacao.preco <= 0)) apresentacao.preco = produto.preco * apresentacao.fator;
  }
  return { produto, apresentacao };
}

async function carregarApresentacoes(produtos, empresaId, connection = pool) {
  if (!produtos.length) return produtos;
  const ids = produtos.map((produto) => produto.id);
  const [apresentacoes] = await connection.query(
    `SELECT pa.* FROM ProdutoApresentacao pa INNER JOIN Produto p ON p.id=pa.produto_id
     WHERE p.empresa_id=? AND pa.produto_id IN (${ids.map(() => "?").join(",")}) AND pa.ativa=TRUE
     ORDER BY pa.fator_conversao`, [empresaId, ...ids],
  );
  return produtos.map((produto) => ({ ...produto, apresentacoes: apresentacoes.filter((item) => Number(item.produto_id) === Number(produto.id)) }));
}

async function gravarApresentacao(connection, produtoId, apresentacao) {
  await connection.execute("DELETE FROM ProdutoApresentacao WHERE produto_id=?", [produtoId]);
  if (apresentacao) await connection.execute(
    "INSERT INTO ProdutoApresentacao (produto_id,nome,fator_conversao,preco,custo,codigo_barras,vendavel) VALUES (?,?,?,?,?,?,?)",
    [produtoId, apresentacao.nome, apresentacao.fator, apresentacao.preco, apresentacao.custo, apresentacao.codigoBarras, apresentacao.vendavel],
  );
}

export const createProduto = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { produto, apresentacao } = normalizarProduto(req.body);
    const empresaId = empresaDoPedido(req);
    const limite = await limiteFoiAtingido(empresaId, "produtos");
    if (limite.atingido) return res.status(403).json({ sucesso: false, erro: `O limite de ${limite.limite} produtos do seu plano foi atingido.`, codigo: "LIMITE_PRODUTOS" });
    if (!(await relacoesPertencemAEmpresa(empresaId, produto.idCategoria, produto.idFornecedor, connection))) return res.status(400).json({ sucesso: false, erro: "A categoria ou o fornecedor não pertence à sua empresa." });
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO Produto (empresa_id,nome,idCategoria,precoFornecedor,preco,idFornecedor,quantidade,codigo_barras,tipo_produto,unidade_base)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [empresaId, produto.nome, produto.idCategoria, produto.precoFornecedor, produto.preco, produto.idFornecedor,
        produto.quantidade, produto.codigoBarras, produto.tipoProduto, produto.unidadeBase],
    );
    await gravarApresentacao(connection, result.insertId, apresentacao);
    await connection.commit();
    await auditar({ empresaId, usuarioId: req.user.id, acao: "criar", entidade: "produto", entidadeId: result.insertId, detalhes: { nome: produto.nome, tipo: produto.tipoProduto } });
    return res.status(201).json({ sucesso: true, id: result.insertId });
  } catch (error) {
    await connection.rollback();
    return res.status(error.status || (error.code === "ER_DUP_ENTRY" ? 409 : 500)).json({ sucesso: false, erro: error.code === "ER_DUP_ENTRY" ? "O código de barras já está em uso." : error.message });
  } finally { connection.release(); }
};

export const getAllProdutos = async (req, res) => {
  try {
    const empresaId = empresaDoPedido(req);
    const [produtos] = await pool.query("SELECT * FROM Produto WHERE empresa_id=?", [empresaId]);
    return res.json({ sucesso: true, produtos: await carregarApresentacoes(produtos, empresaId) });
  } catch (error) { return res.status(500).json({ sucesso: false, erro: error.message }); }
};

export const getProdutoById = async (req, res) => {
  try {
    const empresaId = empresaDoPedido(req);
    const [produtos] = await pool.query("SELECT * FROM Produto WHERE id=? AND empresa_id=?", [req.params.id, empresaId]);
    if (!produtos.length) return res.status(404).json({ sucesso: false, erro: "Produto não encontrado." });
    const [produto] = await carregarApresentacoes(produtos, empresaId);
    return res.json({ sucesso: true, produto });
  } catch (error) { return res.status(500).json({ sucesso: false, erro: error.message }); }
};

export const updateProduto = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { produto, apresentacao } = normalizarProduto(req.body);
    const empresaId = empresaDoPedido(req);
    if (!(await relacoesPertencemAEmpresa(empresaId, produto.idCategoria, produto.idFornecedor, connection))) return res.status(400).json({ sucesso: false, erro: "A categoria ou o fornecedor não pertence à sua empresa." });
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE Produto SET nome=?,idCategoria=?,precoFornecedor=?,preco=?,idFornecedor=?,quantidade=?,codigo_barras=?,tipo_produto=?,unidade_base=?
       WHERE id=? AND empresa_id=?`,
      [produto.nome, produto.idCategoria, produto.precoFornecedor, produto.preco, produto.idFornecedor,
        produto.quantidade, produto.codigoBarras, produto.tipoProduto, produto.unidadeBase, req.params.id, empresaId],
    );
    if (!result.affectedRows) throw Object.assign(new Error("Produto não encontrado."), { status: 404 });
    await gravarApresentacao(connection, req.params.id, apresentacao);
    await connection.commit();
    await auditar({ empresaId, usuarioId: req.user.id, acao: "atualizar", entidade: "produto", entidadeId: req.params.id, detalhes: { nome: produto.nome, tipo: produto.tipoProduto } });
    return res.json({ sucesso: true, mensagem: "Produto atualizado com sucesso." });
  } catch (error) {
    await connection.rollback();
    return res.status(error.status || (error.code === "ER_DUP_ENTRY" ? 409 : 500)).json({ sucesso: false, erro: error.code === "ER_DUP_ENTRY" ? "O código de barras já está em uso." : error.message });
  } finally { connection.release(); }
};

export const deleteProduto = async (req, res) => {
  try {
    const [result] = await pool.execute("DELETE FROM Produto WHERE id=? AND empresa_id=?", [req.params.id, empresaDoPedido(req)]);
    if (!result.affectedRows) return res.status(404).json({ sucesso: false, erro: "Produto não encontrado." });
    await auditar({ empresaId: empresaDoPedido(req), usuarioId: req.user.id, acao: "eliminar", entidade: "produto", entidadeId: req.params.id });
    return res.json({ sucesso: true, mensagem: "Produto removido com sucesso." });
  } catch (error) { return res.status(500).json({ sucesso: false, erro: error.message }); }
};

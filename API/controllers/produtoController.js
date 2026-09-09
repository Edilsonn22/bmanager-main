import pool from "../config/db.js";
import { limiteFoiAtingido } from "../services/assinaturaService.js";
import { auditar } from "../services/auditoriaService.js";

const empresaDoPedido = (req) => req.user?.empresa_id;

async function relacoesPertencemAEmpresa(empresaId, idCategoria, idFornecedor) {
  const [[categoria], [fornecedor]] = await Promise.all([
    pool.query("SELECT id FROM Categoria WHERE id = ? AND empresa_id = ?", [idCategoria, empresaId]),
    pool.query("SELECT id FROM Fornecedor WHERE id = ? AND empresa_id = ?", [idFornecedor, empresaId]),
  ]);
  return categoria.length > 0 && fornecedor.length > 0;
}

export const createProduto = async (req, res) => {
  try {
    const { nome, idCategoria, precoFornecedor, preco, idFornecedor, quantidade, codigo_barras = null } = req.body;
    const empresaId = empresaDoPedido(req);
    if (!nome || !idCategoria || precoFornecedor === undefined || preco === undefined || !idFornecedor || quantidade === undefined) {
      return res.status(400).json({ sucesso: false, erro: "Todos os campos são obrigatórios." });
    }

    const limite = await limiteFoiAtingido(empresaId, "produtos");
    if (limite.atingido) {
      return res.status(403).json({ sucesso: false, erro: `O limite de ${limite.limite} produtos do seu plano foi atingido.`, codigo: "LIMITE_PRODUTOS" });
    }

    if (!(await relacoesPertencemAEmpresa(empresaId, idCategoria, idFornecedor))) {
      return res.status(400).json({ sucesso: false, erro: "A categoria ou o fornecedor não pertence à sua empresa." });
    }
    const [result] = await pool.execute(
      "INSERT INTO Produto (empresa_id, nome, idCategoria, precoFornecedor, preco, idFornecedor, quantidade, codigo_barras) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [empresaId, nome, idCategoria, precoFornecedor, preco, idFornecedor, quantidade, codigo_barras?.trim() || null]
    );
    await auditar({ empresaId, usuarioId: req.user.id, acao: "criar", entidade: "produto", entidadeId: result.insertId, detalhes: { nome } });
    return res.status(201).json({ sucesso: true, id: result.insertId });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

export const getAllProdutos = async (req, res) => {
  try {
    const [produtos] = await pool.query("SELECT * FROM Produto WHERE empresa_id = ?", [empresaDoPedido(req)]);
    return res.status(200).json({ sucesso: true, produtos });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

export const getProdutoById = async (req, res) => {
  try {
    const [produtos] = await pool.query("SELECT * FROM Produto WHERE id = ? AND empresa_id = ?", [req.params.id, empresaDoPedido(req)]);
    if (!produtos.length) return res.status(404).json({ sucesso: false, erro: "Produto não encontrado." });
    return res.status(200).json({ sucesso: true, produto: produtos[0] });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

export const updateProduto = async (req, res) => {
  try {
    const { nome, idCategoria, precoFornecedor, preco, idFornecedor, quantidade, codigo_barras = null } = req.body;
    const empresaId = empresaDoPedido(req);
    if (!nome?.trim() || !idCategoria || !idFornecedor || !Number.isFinite(Number(precoFornecedor)) || Number(precoFornecedor) <= 0 || !Number.isFinite(Number(preco)) || Number(preco) <= 0 || !Number.isInteger(Number(quantidade)) || Number(quantidade) < 0) {
      return res.status(400).json({ sucesso: false, erro: "Preencha todos os campos com valores válidos." });
    }
    if (!(await relacoesPertencemAEmpresa(empresaId, idCategoria, idFornecedor))) {
      return res.status(400).json({ sucesso: false, erro: "A categoria ou o fornecedor não pertence à sua empresa." });
    }
    const [result] = await pool.execute(
      "UPDATE Produto SET nome = ?, idCategoria = ?, precoFornecedor = ?, preco = ?, idFornecedor = ?, quantidade = ?, codigo_barras = ? WHERE id = ? AND empresa_id = ?",
      [nome.trim(), idCategoria, Number(precoFornecedor), Number(preco), idFornecedor, Number(quantidade), codigo_barras?.trim() || null, req.params.id, empresaId]
    );
    if (!result.affectedRows) return res.status(404).json({ sucesso: false, erro: "Produto não encontrado." });
    await auditar({ empresaId, usuarioId: req.user.id, acao: "atualizar", entidade: "produto", entidadeId: req.params.id, detalhes: { nome } });
    return res.status(200).json({ sucesso: true, mensagem: "Produto atualizado com sucesso." });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

export const deleteProduto = async (req, res) => {
  try {
    const [result] = await pool.execute("DELETE FROM Produto WHERE id = ? AND empresa_id = ?", [req.params.id, empresaDoPedido(req)]);
    if (!result.affectedRows) return res.status(404).json({ sucesso: false, erro: "Produto não encontrado." });
    await auditar({ empresaId: empresaDoPedido(req), usuarioId: req.user.id, acao: "eliminar", entidade: "produto", entidadeId: req.params.id });
    return res.status(200).json({ sucesso: true, mensagem: "Produto removido com sucesso." });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
};

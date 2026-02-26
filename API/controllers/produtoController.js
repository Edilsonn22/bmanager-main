import pool from "../config/db.js";

// POST - Criar Produto
export const createProduto = async (req, res) => {
  try {
    const { nome, idCategoria, preco, idFornecedor, quantidade } = req.body;

    if (!nome || !idCategoria || !preco || !idFornecedor || !quantidade) {
      return res.status(400).json({ sucesso: false, erro: "Todos os campos são obrigatórios." });
    }

    const sql = `
      INSERT INTO produto (nome, idCategoria, preco, idFornecedor, quantidade)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [nome, idCategoria, preco, idFornecedor, quantidade]);

    res.status(201).json({ sucesso: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// GET - Listar todos os produtos
export const getAllProdutos = async (req, res) => {
  try {
    const [produtos] = await pool.query("SELECT * FROM produto");
    res.status(200).json({ sucesso: true, produtos });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// GET - Buscar produto por ID
export const getProdutoById = async (req, res) => {
  try {
    const { id } = req.params;
    const [produtos] = await pool.query("SELECT * FROM produto WHERE id = ?", [id]);

    if (produtos.length === 0) {
      return res.status(404).json({ sucesso: false, erro: "Produto não encontrado" });
    }

    res.status(200).json({ sucesso: true, produto: produtos[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// PUT - Atualizar produto
export const updateProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, idCategoria, preco, idFornecedor, quantidade } = req.body;

    const sql = `
      UPDATE produto
      SET nome = ?, idCategoria = ?, preco = ?, idFornecedor = ?, quantidade = ?
      WHERE id = ?
    `;

    const [result] = await pool.execute(sql, [nome, idCategoria, preco, idFornecedor, quantidade, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ sucesso: false, erro: "Produto não encontrado" });
    }

    res.status(200).json({ sucesso: true, mensagem: "Produto atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// DELETE - Remover produto
export const deleteProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute("DELETE FROM produto WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ sucesso: false, erro: "Produto não encontrado" });
    }

    res.status(200).json({ sucesso: true, mensagem: "Produto removido com sucesso" });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};
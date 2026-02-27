import pool from "../config/db.js";

// POST - Criar movimento (entrada ou saída)
export const createMovimento = async (req, res) => {
  try {
    const { id , tipo, quantidade } = req.body;

    if (!id == null || !tipo == null|| !quantidade == null) {
      return res.status(400).json({ sucesso: false, erro: "Todos os campos são obrigatórios." });
    }

    if (!["entrada", "saida"].includes(tipo)) {
      return res.status(400).json({ sucesso: false, erro: "Tipo inválido." });
    }

    // Verificar produto
    const [produtos] = await pool.query("SELECT * FROM produto WHERE id = ?", [id]);
    if (produtos.length === 0) {
      return res.status(404).json({ sucesso: false, erro: "Produto não encontrado." });
    }

    const produto = produtos[0];

    // Impedir saída maior que estoque
    if (tipo === "saida" && quantidade > produto.quantidade) {
      return res.status(400).json({ sucesso: false, erro: "Estoque insuficiente." });
    }

    // Atualizar estoque
    const novaQuantidade = tipo === "entrada"
      ? produto.quantidade + quantidade
      : produto.quantidade - quantidade;

    await pool.execute("UPDATE produto SET quantidade = ? WHERE id = ?", [novaQuantidade, produto_id]);

    // Inserir movimento
    const sql = "INSERT INTO movimentos (produto_id, tipo, quantidade) VALUES (?, ?, ?)";
    const [result] = await pool.execute(sql, [id, tipo, quantidade]);

    res.status(201).json({ sucesso: true, id: result.insertId });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// GET - Listar todos os movimentos
export const getAllMovimentos = async (req, res) => {
  try {
    const sql = `
      SELECT m.id, m.id, m.tipo, m.quantidade, m.data, p.nome
      FROM movimentos m
      JOIN produto p ON p.id = m.produto_id
      ORDER BY m.data DESC
    `;
    const [movimentos] = await pool.query(sql);
    res.status(200).json({ sucesso: true, movimentos });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// GET - Buscar movimento por ID
export const getMovimentoById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT m.id, m.produto_id, m.tipo, m.quantidade, m.data, p.nome
      FROM movimentos m
      JOIN produto p ON p.id = m.produto_id
      WHERE m.id = ?
    `;
    const [movimentos] = await pool.query(sql, [id]);

    if (movimentos.length === 0) {
      return res.status(404).json({ sucesso: false, erro: "Movimento não encontrado." });
    }

    res.status(200).json({ sucesso: true, movimento: movimentos[0] });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// PUT - Atualizar movimento (opcional, normalmente não se altera)
export const updateMovimento = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, quantidade } = req.body;

    const [movimentos] = await pool.query("SELECT * FROM movimentos WHERE id = ?", [id]);
    if (movimentos.length === 0) {
      return res.status(404).json({ sucesso: false, erro: "Movimento não encontrado." });
    }

    const movimento = movimentos[0];

    // Atualizar movimento
    await pool.execute(
      "UPDATE movimentos SET tipo = ?, quantidade = ? WHERE id = ?",
      [tipo, quantidade, id]
    );

    res.status(200).json({ sucesso: true, mensagem: "Movimento atualizado com sucesso." });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// DELETE - Remover movimento
export const deleteMovimento = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute("DELETE FROM movimentos WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ sucesso: false, erro: "Movimento não encontrado." });
    }

    res.status(200).json({ sucesso: true, mensagem: "Movimento removido com sucesso." });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};
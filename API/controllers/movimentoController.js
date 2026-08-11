import pool from '../config/db.js';

export const createMovimento = async (req, res) => {
  try {
    const { id_Produto, tipo, quantidade } = req.body;

    if (!id_Produto || !tipo || !quantidade) {
      return res.status(400).json({
        sucesso: false,
        erro: "Todos os campos são obrigatórios."
      });
    }

    if (!["entrada", "saida"].includes(tipo)) {
      return res.status(400).json({
        sucesso: false,
        erro: "Tipo inválido."
      });
    }

    const qtd = Number(quantidade);

    const [produtos] = await pool.query(
      "SELECT * FROM Produto WHERE id = ?",
      [id_Produto]
    );

    if (produtos.length === 0) {
      return res.status(404).json({
        sucesso: false,
        erro: "Produto não encontrado."
      });
    }

    const produto = produtos[0];

    if (tipo === "saida" && qtd > produto.quantidade) {
      return res.status(400).json({
        sucesso: false,
        erro: "Estoque insuficiente."
      });
    }

    const novaQuantidade =
      tipo === "entrada"
        ? produto.quantidade + qtd
        : produto.quantidade - qtd;

    await pool.execute(
      "UPDATE Produto SET quantidade = ? WHERE id = ?",
      [novaQuantidade, id_Produto]
    );

    const sql = `
      INSERT INTO Movimentos (
        id_Produto,
        tipo,
        quantidade
      )
      VALUES (?, ?, ?)
    `;

    const [result] = await pool.execute(
      sql,
      [id_Produto, tipo, qtd]
    );

    res.status(201).json({
      sucesso: true,
      id: result.insertId
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};


// GET - Listar todos os movimentos
export const getAllMovimentos = async (req, res) => {
  try {

    const sql = `
      SELECT 
        m.id,
        m.id_Produto AS produtoId,
        m.tipo,
        m.quantidade,
        m.created_at,
        p.nome AS nomeProduto
      FROM movimentos m
      JOIN Produto p
        ON p.id = m.id_Produto
      ORDER BY m.created_at DESC
    `;

    const [movimentos] = await pool.query(sql);

    res.status(200).json({
      sucesso: true,
      movimentos
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      sucesso: false,
      erro: error.message
    });
  }
};
import pool from "../config/db.js";

// GET - Listar todos os fornecedores
export const listarFornecedores = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nome FROM Fornecedor");
    res.json({
      sucesso: true,
      fornecedores: rows
    });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};
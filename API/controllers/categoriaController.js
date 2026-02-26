import pool from "../config/db.js";

// GET - Listar todas as categorias
export const listarCategorias = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nome, descr FROM Categoria"
    );
    res.json({
      sucesso: true,
      categorias: rows
    });
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};

// DELETE - Deletar uma categoria
export const deletarCategoria = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM Categoria WHERE idCategoria = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ sucesso: false, erro: "Categoria não encontrada" });
    }
    res.json({ sucesso: true, mensagem: "Categoria deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    res.status(500).json({ sucesso: false, erro: error.message });
  }
};
import pool from "../config/db.js";

const empresaId = (req) => req.user?.empresa_id;

export const listarCategorias = async (req, res) => {
  try {
    const [categorias] = await pool.query(
      "SELECT id, nome, descr FROM Categoria WHERE empresa_id = ? ORDER BY nome ASC", [empresaId(req)]
    );
    return res.json({ sucesso: true, categorias });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "Não foi possível listar categorias." });
  }
};

export const obterCategoria = async (req, res) => {
  try {
    const [categorias] = await pool.query(
      "SELECT id, nome, descr FROM Categoria WHERE id = ? AND empresa_id = ?",
      [req.params.id, empresaId(req)]
    );
    if (!categorias.length) return res.status(404).json({ sucesso: false, erro: "Categoria não encontrada." });
    return res.json({ sucesso: true, categoria: categorias[0] });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "Não foi possível obter a categoria." });
  }
};

export const criarCategoria = async (req, res) => {
  try {
    const { nome, descr } = req.body;
    if (!nome?.trim() || !descr?.trim()) return res.status(400).json({ sucesso: false, erro: "Nome e descrição são obrigatórios." });
    const [result] = await pool.execute(
      "INSERT INTO Categoria (empresa_id, nome, descr) VALUES (?, ?, ?)", [empresaId(req), nome.trim(), descr.trim()]
    );
    return res.status(201).json({ sucesso: true, id: result.insertId });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "Não foi possível criar a categoria." });
  }
};

export const atualizarCategoria = async (req, res) => {
  try {
    const { nome, descr } = req.body;
    if (!nome?.trim() || !descr?.trim()) return res.status(400).json({ sucesso: false, erro: "Nome e descrição são obrigatórios." });
    const [result] = await pool.execute(
      "UPDATE Categoria SET nome = ?, descr = ? WHERE id = ? AND empresa_id = ?",
      [nome.trim(), descr.trim(), req.params.id, empresaId(req)]
    );
    if (!result.affectedRows) return res.status(404).json({ sucesso: false, erro: "Categoria não encontrada." });
    return res.json({ sucesso: true });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "Não foi possível atualizar a categoria." });
  }
};

export const deletarCategoria = async (req, res) => {
  try {
    const [result] = await pool.execute("DELETE FROM Categoria WHERE id = ? AND empresa_id = ?", [req.params.id, empresaId(req)]);
    if (!result.affectedRows) return res.status(404).json({ sucesso: false, erro: "Categoria não encontrada." });
    return res.json({ sucesso: true, mensagem: "Categoria removida com sucesso." });
  } catch (error) {
    return res.status(409).json({ sucesso: false, erro: "Não é possível remover uma categoria que possui produtos." });
  }
};

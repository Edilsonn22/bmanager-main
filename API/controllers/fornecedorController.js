import pool from "../config/db.js";

const empresaId = (req) => req.user?.empresa_id;
const campos = (body) => [body.nome?.trim(), body.email?.trim() || null, body.contacto?.trim() || null, body.endereco?.trim() || null];

export const listarFornecedores = async (req, res) => {
  try {
    const [fornecedores] = await pool.query(
      "SELECT id, nome, email, contacto, endereco FROM Fornecedor WHERE empresa_id = ? ORDER BY nome ASC", [empresaId(req)]
    );
    return res.json({ sucesso: true, fornecedores });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "Não foi possível listar fornecedores." });
  }
};

export const obterFornecedor = async (req, res) => {
  try {
    const [fornecedores] = await pool.query(
      "SELECT id, nome, email, contacto, endereco FROM Fornecedor WHERE id = ? AND empresa_id = ?",
      [req.params.id, empresaId(req)]
    );
    if (!fornecedores.length) return res.status(404).json({ sucesso: false, erro: "Fornecedor não encontrado." });
    return res.json({ sucesso: true, fornecedor: fornecedores[0] });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "Não foi possível obter o fornecedor." });
  }
};

export const criarFornecedor = async (req, res) => {
  try {
    const values = campos(req.body);
    if (!values[0]) return res.status(400).json({ sucesso: false, erro: "O nome é obrigatório." });
    const [result] = await pool.execute(
      "INSERT INTO Fornecedor (empresa_id, nome, email, contacto, endereco) VALUES (?, ?, ?, ?, ?)", [empresaId(req), ...values]
    );
    return res.status(201).json({ sucesso: true, id: result.insertId });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "Não foi possível criar o fornecedor." });
  }
};

export const atualizarFornecedor = async (req, res) => {
  try {
    const values = campos(req.body);
    if (!values[0]) return res.status(400).json({ sucesso: false, erro: "O nome é obrigatório." });
    const [result] = await pool.execute(
      "UPDATE Fornecedor SET nome = ?, email = ?, contacto = ?, endereco = ? WHERE id = ? AND empresa_id = ?",
      [...values, req.params.id, empresaId(req)]
    );
    if (!result.affectedRows) return res.status(404).json({ sucesso: false, erro: "Fornecedor não encontrado." });
    return res.json({ sucesso: true });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: "Não foi possível atualizar o fornecedor." });
  }
};

export const deletarFornecedor = async (req, res) => {
  try {
    const [result] = await pool.execute("DELETE FROM Fornecedor WHERE id = ? AND empresa_id = ?", [req.params.id, empresaId(req)]);
    if (!result.affectedRows) return res.status(404).json({ sucesso: false, erro: "Fornecedor não encontrado." });
    return res.json({ sucesso: true, mensagem: "Fornecedor removido com sucesso." });
  } catch (error) {
    return res.status(409).json({ sucesso: false, erro: "Não é possível remover um fornecedor que possui produtos." });
  }
};

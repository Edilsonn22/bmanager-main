import pool from "../config/db.js";

export async function listarClientes(req, res) {
  const [clientes] = await pool.query("SELECT * FROM Cliente WHERE empresa_id=? ORDER BY nome", [req.user.empresa_id]);
  res.json({ sucesso: true, clientes });
}

export async function criarCliente(req, res) {
  const { nome, nuit = null, telefone = null, email = null, endereco = null } = req.body;
  if (!nome?.trim()) return res.status(400).json({ sucesso: false, erro: "Informe o nome do cliente." });
  const [result] = await pool.execute("INSERT INTO Cliente (empresa_id,nome,nuit,telefone,email,endereco) VALUES (?,?,?,?,?,?)", [req.user.empresa_id, nome.trim(), nuit || null, telefone || null, email || null, endereco || null]);
  res.status(201).json({ sucesso: true, cliente: { id: result.insertId, nome: nome.trim(), nuit, telefone, email, endereco } });
}

export async function atualizarCliente(req, res) {
  const { nome, nuit = null, telefone = null, email = null, endereco = null } = req.body;
  if (!nome?.trim()) return res.status(400).json({ sucesso: false, erro: "Informe o nome do cliente." });
  const [result] = await pool.execute("UPDATE Cliente SET nome=?,nuit=?,telefone=?,email=?,endereco=? WHERE id=? AND empresa_id=?", [nome.trim(), nuit || null, telefone || null, email || null, endereco || null, req.params.id, req.user.empresa_id]);
  if (!result.affectedRows) return res.status(404).json({ sucesso: false, erro: "Cliente não encontrado." });
  res.json({ sucesso: true });
}

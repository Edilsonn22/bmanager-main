import pool from "../config/db.js";
import { auditar } from "../services/auditoriaService.js";
export const criarTicket = async (req, res) => {
  const { assunto, mensagem } = req.body ?? {};
  if (!assunto?.trim() || !mensagem?.trim()) return res.status(400).json({ sucesso: false, erro: "Assunto e mensagem são obrigatórios." });
  const [r] = await pool.execute("INSERT INTO tickets_suporte (empresa_id, usuario_id, assunto, mensagem) VALUES (?, ?, ?, ?)", [req.user.empresa_id, req.user.id, assunto.trim(), mensagem.trim()]);
  await auditar({ empresaId: req.user.empresa_id, usuarioId: req.user.id, acao: "criar", entidade: "ticket", entidadeId: r.insertId });
  return res.status(201).json({ sucesso: true, id: r.insertId });
};
export const meusTickets = async (req, res) => { const [tickets] = await pool.execute("SELECT id, assunto, mensagem, estado, created_at FROM tickets_suporte WHERE empresa_id = ? ORDER BY created_at DESC", [req.user.empresa_id]); return res.json({ sucesso: true, tickets }); };
export const todosTickets = async (_req, res) => { const [tickets] = await pool.query("SELECT t.id, t.assunto, t.mensagem, t.estado, t.created_at, t.updated_at, e.nome AS empresa, u.nome AS utilizador, u.email FROM tickets_suporte t INNER JOIN Empresa e ON e.id = t.empresa_id INNER JOIN Usuario u ON u.id = t.usuario_id ORDER BY FIELD(t.estado, 'aberto', 'em_andamento', 'resolvido', 'fechado'), t.updated_at DESC"); return res.json({ sucesso: true, tickets }); };

export const atualizarEstadoTicket = async (req, res) => {
  const estadosPermitidos = ["em_andamento", "resolvido", "fechado"];
  const { estado } = req.body ?? {};
  if (!estadosPermitidos.includes(estado)) return res.status(400).json({ sucesso: false, erro: "Estado inválido." });

  const [resultado] = await pool.execute("UPDATE tickets_suporte SET estado = ? WHERE id = ?", [estado, req.params.id]);
  if (!resultado.affectedRows) return res.status(404).json({ sucesso: false, erro: "Solicitação não encontrada." });

  const [[ticket]] = await pool.execute("SELECT id, estado, updated_at FROM tickets_suporte WHERE id = ?", [req.params.id]);
  await auditar({ usuarioId: req.user.id, acao: "atualizar_estado", entidade: "ticket", entidadeId: req.params.id, detalhes: { estado } });
  return res.json({ sucesso: true, ticket });
};

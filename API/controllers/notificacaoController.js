import pool from "../config/db.js";
import { processarRotinaAssinaturas } from "../services/rotinaAssinaturasService.js";

export const listar = async (req, res) => {
  const [notificacoes] = await pool.execute(
    "SELECT id, tipo, titulo, mensagem, lida, created_at FROM notificacoes WHERE empresa_id = ? ORDER BY created_at DESC LIMIT 50",
    [req.user.empresa_id]
  );
  return res.json({ sucesso: true, notificacoes });
};

export const marcarComoLida = async (req, res) => {
  await pool.execute("UPDATE notificacoes SET lida = TRUE WHERE id = ? AND empresa_id = ?", [req.params.id, req.user.empresa_id]);
  return res.json({ sucesso: true });
};

export const processarAvisos = async (_req, res) => {
  const resumo = await processarRotinaAssinaturas();
  return res.json({ sucesso: true, resumo });
};

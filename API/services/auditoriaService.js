import pool from "../config/db.js";
export const auditar = ({ empresaId = null, usuarioId = null, acao, entidade, entidadeId = null, detalhes = null }) =>
  pool.execute("INSERT INTO auditoria (empresa_id, usuario_id, acao, entidade, entidade_id, detalhes) VALUES (?, ?, ?, ?, ?, ?)", [empresaId, usuarioId, acao, entidade, entidadeId, detalhes ? JSON.stringify(detalhes) : null]);

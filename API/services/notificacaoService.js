import pool from "../config/db.js";
import { enviarAvisoExpiracao, enviarEmailSeguro } from "./emailService.js";

const buscarEmailAdministrador = async (empresaId) => {
  const [usuarios] = await pool.execute(
    "SELECT email FROM Usuario WHERE empresa_id = ? AND role = 'admin' LIMIT 1",
    [empresaId],
  );
  return usuarios[0]?.email;
};

export const criarNotificacao = async ({ empresaId, tipo, titulo, mensagem }) => {
  await pool.execute(
    "INSERT INTO notificacoes (empresa_id, tipo, titulo, mensagem) VALUES (?, ?, ?, ?)",
    [empresaId, tipo, titulo, mensagem]
  );
  const email = await buscarEmailAdministrador(empresaId);
  if (email) enviarEmailSeguro({ para: email, assunto: titulo, html: `<p>${mensagem}</p>` });
};

export const criarAvisosDeExpiracao = async () => {
  const [assinaturas] = await pool.query(
    `SELECT a.empresa_id, p.nome, DATE(a.expira_em) AS expira_em
     FROM assinaturas a INNER JOIN planos p ON p.id = a.plano_id
     WHERE a.estado = 'ativa' AND a.expira_em BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)`
  );
  for (const assinatura of assinaturas) {
    const [resultado] = await pool.execute(
      `INSERT INTO notificacoes (empresa_id, tipo, titulo, mensagem)
       SELECT ?, 'assinatura_expira', 'A assinatura está a expirar', ?
       WHERE NOT EXISTS (
         SELECT 1 FROM notificacoes WHERE empresa_id = ? AND tipo = 'assinatura_expira' AND DATE(created_at) = CURDATE()
       )`,
      [assinatura.empresa_id, `O plano ${assinatura.nome} expira em ${String(assinatura.expira_em).slice(0, 10)}.`, assinatura.empresa_id]
    );
    if (resultado.affectedRows) {
      const email = await buscarEmailAdministrador(assinatura.empresa_id);
      if (email) enviarAvisoExpiracao({
        para: email,
        plano: assinatura.nome,
        data: String(assinatura.expira_em).slice(0, 10),
      });
    }
  }
  return assinaturas.length;
};

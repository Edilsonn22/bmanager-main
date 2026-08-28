import pool from "../config/db.js";

export const verificarAssinatura = async (req, res, next) => {
  try {
    const [assinaturas] = await pool.execute(
      `SELECT id FROM assinaturas
       WHERE empresa_id = ? AND estado = 'ativa' AND (expira_em IS NULL OR expira_em > NOW())`,
      [req.user.empresa_id]
    );
    if (!assinaturas.length) {
      return res.status(402).json({
        sucesso: false,
        erro: "Não existe uma assinatura ativa para esta empresa.",
        codigo: "ASSINATURA_INATIVA",
      });
    }
    return next();
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível verificar a assinatura." });
  }
};

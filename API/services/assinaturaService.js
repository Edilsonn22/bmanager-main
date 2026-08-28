import pool from "../config/db.js";

export const obterLimitesDoPlanoAtivo = async (empresaId) => {
  const [assinaturas] = await pool.execute(
    `SELECT p.limite_usuarios, p.limite_produtos
     FROM assinaturas a INNER JOIN planos p ON p.id = a.plano_id
     WHERE a.empresa_id = ? AND a.estado = 'ativa' AND (a.expira_em IS NULL OR a.expira_em > NOW())`,
    [empresaId]
  );
  return assinaturas[0] || null;
};

export const limiteFoiAtingido = async (empresaId, recurso) => {
  const campoLimite = recurso === "usuarios" ? "limite_usuarios" : "limite_produtos";
  const tabela = recurso === "usuarios" ? "Usuario" : "Produto";
  const limites = await obterLimitesDoPlanoAtivo(empresaId);
  if (!limites) return { semAssinatura: true };

  const [contagem] = await pool.query(`SELECT COUNT(*) AS total FROM ${tabela} WHERE empresa_id = ?`, [empresaId]);
  return { atingido: contagem[0].total >= limites[campoLimite], limite: limites[campoLimite], total: contagem[0].total };
};

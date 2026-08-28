import pool from "../config/db.js";
import { ehPlatformAdmin } from "../middlewares/platformAdmin.js";

export const meuAcessoPlataforma = (req, res) => res.json({ sucesso: true, proprietario: ehPlatformAdmin(req.user) });

export const resumoPlataforma = async (_req, res) => {
  try {
    const [[empresas], [usuarios], [assinaturas], [pagamentos], [receita], [recentes]] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM Empresa"),
      pool.query("SELECT COUNT(*) AS total FROM Usuario"),
      pool.query("SELECT estado, COUNT(*) AS total FROM assinaturas GROUP BY estado"),
      pool.query("SELECT estado, COUNT(*) AS total FROM pagamentos GROUP BY estado"),
      pool.query("SELECT COALESCE(SUM(valor), 0) AS total FROM pagamentos WHERE estado = 'pago' AND pago_em >= DATE_FORMAT(NOW(), '%Y-%m-01')"),
      pool.query(`SELECT e.nome AS empresa, p.referencia, p.valor, p.moeda, p.estado, p.created_at
                  FROM pagamentos p INNER JOIN Empresa e ON e.id = p.empresa_id
                  ORDER BY p.created_at DESC LIMIT 10`),
    ]);
    return res.json({
      sucesso: true,
      resumo: { empresas: empresas[0].total, usuarios: usuarios[0].total, assinaturas, pagamentos, receita_mes: receita[0].total },
      pagamentos_recentes: recentes,
    });
  } catch (error) {
    console.error("Erro no resumo da plataforma:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível carregar o painel da plataforma." });
  }
};

export const listarEmpresas = async (_req, res) => {
  const [empresas] = await pool.query(`SELECT e.id, e.nome, e.bloqueada, e.created_at, a.estado AS assinatura_estado, a.expira_em, p.nome AS plano,
    (SELECT COUNT(*) FROM Usuario u WHERE u.empresa_id = e.id) AS usuarios,
    (SELECT COUNT(*) FROM Produto pr WHERE pr.empresa_id = e.id) AS produtos
    FROM Empresa e LEFT JOIN assinaturas a ON a.empresa_id = e.id LEFT JOIN planos p ON p.id = a.plano_id ORDER BY e.created_at DESC`);
  return res.json({ sucesso: true, empresas });
};
export const alternarBloqueioEmpresa = async (req, res) => { const [r] = await pool.execute("UPDATE Empresa SET bloqueada = NOT bloqueada WHERE id = ?", [req.params.id]); return r.affectedRows ? res.json({ sucesso: true }) : res.status(404).json({ sucesso: false, erro: "Empresa não encontrada." }); };

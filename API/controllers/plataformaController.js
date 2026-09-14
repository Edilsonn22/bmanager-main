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
  const [empresas] = await pool.query(`SELECT e.id, e.nome, e.nuit, e.email, e.telefone, e.endereco, e.bloqueada, e.created_at, a.estado AS assinatura_estado, a.expira_em, p.nome AS plano,
    (SELECT COUNT(*) FROM Usuario u WHERE u.empresa_id = e.id) AS usuarios,
    (SELECT COUNT(*) FROM Produto pr WHERE pr.empresa_id = e.id AND pr.arquivado_em IS NULL) AS produtos
    FROM Empresa e LEFT JOIN assinaturas a ON a.empresa_id = e.id LEFT JOIN planos p ON p.id = a.plano_id ORDER BY e.created_at DESC`);
  return res.json({ sucesso: true, empresas });
};
export const listarUtilizadores = async (req, res) => {
  try {
    const busca = String(req.query.busca || "").trim().slice(0, 100);
    const pagina = Math.max(Number.parseInt(req.query.pagina, 10) || 1, 1);
    const limite = Math.min(Math.max(Number.parseInt(req.query.limite, 10) || 20, 1), 100);
    const offset = (pagina - 1) * limite;
    const termo = `%${busca}%`;
    const filtro = busca ? "WHERE u.nome LIKE ? OR u.email LIKE ? OR e.nome LIKE ?" : "";
    const parametros = busca ? [termo, termo, termo] : [];

    const [[utilizadores], [contagem]] = await Promise.all([
      pool.query(
        `SELECT u.id, u.nome, u.email, u.role, u.created_at,
                e.id AS empresa_id, e.nome AS empresa, e.email AS empresa_email,
                e.telefone AS empresa_telefone, e.bloqueada,
                p.nome AS plano, a.estado AS assinatura_estado
         FROM Usuario u
         INNER JOIN Empresa e ON e.id = u.empresa_id
         LEFT JOIN assinaturas a ON a.empresa_id = e.id
         LEFT JOIN planos p ON p.id = a.plano_id
         ${filtro}
         ORDER BY u.created_at DESC
         LIMIT ${limite} OFFSET ${offset}`,
        parametros,
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM Usuario u
         INNER JOIN Empresa e ON e.id = u.empresa_id ${filtro}`,
        parametros,
      ),
    ]);

    const total = Number(contagem[0]?.total || 0);
    return res.json({
      sucesso: true,
      utilizadores,
      paginacao: { pagina, limite, total, total_paginas: Math.max(Math.ceil(total / limite), 1) },
    });
  } catch (error) {
    console.error("Erro ao listar utilizadores da plataforma:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível carregar os utilizadores registados." });
  }
};

export const alternarBloqueioEmpresa = async (req, res) => { const [r] = await pool.execute("UPDATE Empresa SET bloqueada = NOT bloqueada WHERE id = ?", [req.params.id]); return r.affectedRows ? res.json({ sucesso: true }) : res.status(404).json({ sucesso: false, erro: "Empresa não encontrada." }); };

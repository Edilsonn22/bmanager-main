import pool from "../config/db.js";

export const listarHistorico = async (req, res) => {
  try {
    const [pagamentos] = await pool.execute(
      `SELECT p.id, p.referencia, p.gateway, p.metodo, p.valor, p.moeda, p.estado, p.pago_em, p.created_at,
              pl.nome AS plano_nome, pl.tipo AS plano_tipo
       FROM pagamentos p INNER JOIN planos pl ON pl.id = p.plano_id
       WHERE p.empresa_id = ? ORDER BY p.created_at DESC`,
      [req.user.empresa_id]
    );
    return res.json({ sucesso: true, pagamentos });
  } catch (error) {
    console.error("Erro ao listar histórico:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível carregar o histórico." });
  }
};

export const obterFatura = async (req, res) => {
  try {
    const [pagamentos] = await pool.execute(
      `SELECT p.id, p.referencia, p.gateway, p.metodo, p.valor, p.moeda, p.estado, p.transaction_id, p.pago_em, p.created_at,
              pl.nome AS plano_nome, e.nome AS empresa_nome, e.nuit AS empresa_nuit, e.email AS empresa_email,
              e.telefone AS empresa_telefone, e.endereco AS empresa_endereco
       FROM pagamentos p INNER JOIN planos pl ON pl.id = p.plano_id
       INNER JOIN Empresa e ON e.id = p.empresa_id
       WHERE p.id = ? AND p.empresa_id = ?`,
      [req.params.id, req.user.empresa_id]
    );
    if (!pagamentos[0]) return res.status(404).json({ sucesso: false, erro: "Pagamento não encontrado." });
    const fatura = pagamentos[0];
    fatura.numero_fiscal = `BM-${new Date(fatura.created_at).getFullYear()}-${String(fatura.id).padStart(6, "0")}`;
    return res.json({ sucesso: true, fatura });
  } catch (error) {
    console.error("Erro ao gerar fatura:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível gerar a fatura." });
  }
};

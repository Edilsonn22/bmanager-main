import pool from "../config/db.js";

const semEmpresa = (req, res) => {
  if (req.user.empresa_id) return false;
  res.status(403).json({ sucesso: false, erro: "A conta de proprietário não possui assinatura de empresa." });
  return true;
};

export const minhaAssinatura = async (req, res) => {
  if (semEmpresa(req, res)) return;
  try {
    const [assinaturas] = await pool.execute(
      `SELECT CASE WHEN a.expira_em IS NOT NULL AND a.expira_em <= NOW() THEN 'expirada' ELSE a.estado END AS status,
              a.inicia_em, a.expira_em, a.cancelamento_agendado_em,
              p.id AS plano_id, p.nome AS plano_nome, p.tipo AS plano_tipo, p.preco AS valor,
              pp.id AS plano_pendente_id, pp.nome AS plano_pendente_nome
       FROM assinaturas a
       INNER JOIN planos p ON p.id = a.plano_id
       LEFT JOIN planos pp ON pp.id = a.plano_pendente_id
       WHERE a.empresa_id = ?`,
      [req.user.empresa_id],
    );
    return res.json({ sucesso: true, assinatura: assinaturas[0] || null });
  } catch (error) {
    console.error("Erro ao consultar assinatura:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível consultar a assinatura." });
  }
};

export const cancelarMinhaAssinatura = async (req, res) => {
  if (semEmpresa(req, res)) return;
  try {
    const [resultado] = await pool.execute(
      `UPDATE assinaturas
       SET cancelada_em = NOW(), cancelamento_agendado_em = COALESCE(expira_em, NOW())
       WHERE empresa_id = ? AND estado = 'ativa' AND cancelamento_agendado_em IS NULL`,
      [req.user.empresa_id],
    );
    if (!resultado.affectedRows) {
      return res.status(409).json({ sucesso: false, erro: "Não existe assinatura ativa ou o cancelamento já foi agendado." });
    }
    return res.json({ sucesso: true, mensagem: "Renovação cancelada. O acesso permanece ativo até ao fim do período atual." });
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível cancelar a assinatura." });
  }
};

export const reativarMinhaAssinatura = async (req, res) => {
  if (semEmpresa(req, res)) return;
  try {
    const [resultado] = await pool.execute(
      `UPDATE assinaturas SET cancelada_em = NULL, cancelamento_agendado_em = NULL
       WHERE empresa_id = ? AND estado = 'ativa' AND cancelamento_agendado_em IS NOT NULL`,
      [req.user.empresa_id],
    );
    if (!resultado.affectedRows) {
      return res.status(409).json({ sucesso: false, erro: "Não existe cancelamento agendado para reverter." });
    }
    return res.json({ sucesso: true, mensagem: "Renovação reativada." });
  } catch (error) {
    console.error("Erro ao reativar assinatura:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível reativar a assinatura." });
  }
};

export const agendarDowngrade = async (req, res) => {
  if (semEmpresa(req, res)) return;
  const planoId = Number(req.body?.planoId);
  if (!Number.isInteger(planoId) || planoId <= 0) {
    return res.status(400).json({ sucesso: false, erro: "Selecione um plano válido." });
  }

  try {
    const [[assinaturas], [planos]] = await Promise.all([
      pool.execute(
        `SELECT a.id, p.preco FROM assinaturas a
         INNER JOIN planos p ON p.id = a.plano_id
         WHERE a.empresa_id = ? AND a.estado = 'ativa'`,
        [req.user.empresa_id],
      ),
      pool.execute("SELECT id, nome, preco FROM planos WHERE id = ? AND ativo = TRUE AND preco > 0", [planoId]),
    ]);
    const assinatura = assinaturas[0];
    const novoPlano = planos[0];
    if (!assinatura) return res.status(409).json({ sucesso: false, erro: "Não existe assinatura ativa para alterar." });
    if (!novoPlano) return res.status(404).json({ sucesso: false, erro: "Selecione um plano pago válido. O teste gratuito está disponível apenas no primeiro registo." });
    if (Number(novoPlano.preco) >= Number(assinatura.preco)) {
      return res.status(409).json({ sucesso: false, codigo: "PAGAMENTO_NECESSARIO", erro: "Upgrade exige confirmação de pagamento." });
    }

    await pool.execute("UPDATE assinaturas SET plano_pendente_id = ? WHERE id = ?", [planoId, assinatura.id]);
    return res.json({
      sucesso: true,
      mensagem: `Downgrade para ${novoPlano.nome} agendado para a próxima renovação. O plano atual permanece ativo até ao fim do período pago.`,
    });
  } catch (error) {
    console.error("Erro ao agendar downgrade:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível agendar o downgrade." });
  }
};

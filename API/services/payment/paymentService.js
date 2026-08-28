import pool from "../../config/db.js";
import { enviarConfirmacaoPagamento } from "../emailService.js";

export const obterPlanoAtivo = async (planoId) => {
  const [planos] = await pool.execute(
    "SELECT id, nome, descricao, preco, tipo FROM planos WHERE id = ? AND ativo = 1",
    [planoId]
  );
  return planos[0];
};

export const registrarPagamentoPendente = async ({ empresaId, usuarioId, planoId, providerId, referencia, valor, checkoutUrl, method, descricao, payload, gateway = "debito" }) => {
  await pool.execute(
    `INSERT INTO pagamentos
       (empresa_id, plano_id, id_usuario, referencia, gateway, metodo, valor, gateway_reference, checkout_url, descricao, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [empresaId, planoId, usuarioId, referencia, gateway, method || null, valor, providerId, checkoutUrl || null, descricao || null, JSON.stringify(payload)]
  );
};

export const obterPagamentoDaEmpresa = async (empresaId, providerId) => {
  const [pagamentos] = await pool.execute(
    `SELECT p.id, p.gateway_reference AS provider_id, p.referencia, p.valor, p.estado AS status,
            p.checkout_url, p.pago_em, p.created_at, pl.id AS plano_id, pl.nome AS plano_nome, pl.tipo AS plano_tipo
     FROM pagamentos p INNER JOIN planos pl ON pl.id = p.plano_id
     WHERE p.empresa_id = ? AND p.gateway_reference = ?`,
    [empresaId, providerId]
  );
  return pagamentos[0];
};

export const processarWebhookPagamento = async ({ providerId, event, payload, gateway = "debito" }) => {
  const connection = await pool.getConnection();
  let confirmacaoPagamento;
  try {
    await connection.beginTransaction();
    const [pagamentos] = await connection.execute(
      `SELECT p.id, p.empresa_id, p.plano_id, p.estado, p.valor, p.moeda, pl.tipo, pl.nome AS plano_nome
       FROM pagamentos p INNER JOIN planos pl ON pl.id = p.plano_id
       WHERE p.gateway = ? AND p.gateway_reference = ? FOR UPDATE`,
      [gateway, providerId]
    );
    const pagamento = pagamentos[0];
    if (!pagamento) {
      await connection.commit();
      return { encontrado: false };
    }

    await connection.execute(
      "INSERT INTO pagamento_eventos (id_pagamento, evento, payload, processado) VALUES (?, ?, ?, FALSE)",
      [pagamento.id, event, JSON.stringify(payload)]
    );

    if (event === "payment.success" && pagamento.estado !== "pago") {
      const meses = pagamento.tipo === "anual" ? 12 : 1;
      const transacaoId = payload?.data?.transaction?.transaction_id || null;
      await connection.execute(
        `UPDATE pagamentos SET estado = 'pago', pago_em = NOW(), transaction_id = COALESCE(?, transaction_id), metadata = ? WHERE id = ?`,
        [transacaoId, JSON.stringify(payload), pagamento.id]
      );
      await connection.execute(
        `INSERT INTO assinaturas (empresa_id, plano_id, estado, inicia_em, expira_em)
         VALUES (?, ?, 'ativa', NOW(), CASE WHEN ? = 'vitalicio' THEN NULL ELSE DATE_ADD(NOW(), INTERVAL ? MONTH) END)
         ON DUPLICATE KEY UPDATE
           plano_id = VALUES(plano_id), estado = 'ativa', plano_pendente_id = NULL,
           cancelada_em = NULL, cancelamento_agendado_em = NULL,
           inicia_em = CASE WHEN estado = 'ativa' AND (expira_em IS NULL OR expira_em > NOW()) THEN inicia_em ELSE NOW() END,
           expira_em = CASE
             WHEN ? = 'vitalicio' THEN NULL
             WHEN estado = 'ativa' AND expira_em > NOW() THEN DATE_ADD(expira_em, INTERVAL ? MONTH)
             ELSE DATE_ADD(NOW(), INTERVAL ? MONTH)
           END`,
        [pagamento.empresa_id, pagamento.plano_id, pagamento.tipo, meses, pagamento.tipo, meses, meses]
      );
      confirmacaoPagamento = pagamento;
    } else if (event === "payment.failed" && pagamento.estado === "pendente") {
      await connection.execute("UPDATE pagamentos SET estado = 'falhou', metadata = ? WHERE id = ?", [JSON.stringify(payload), pagamento.id]);
    }
    await connection.execute("UPDATE pagamento_eventos SET processado = TRUE WHERE id_pagamento = ? AND evento = ? AND processado = FALSE", [pagamento.id, event]);
    await connection.commit();
    if (confirmacaoPagamento) {
      const [administradores] = await pool.execute(
        "SELECT email FROM Usuario WHERE empresa_id = ? AND role = 'admin' LIMIT 1",
        [confirmacaoPagamento.empresa_id],
      );
      if (administradores[0]) {
        enviarConfirmacaoPagamento({
          para: administradores[0].email,
          plano: confirmacaoPagamento.plano_nome,
          valor: confirmacaoPagamento.valor,
          moeda: confirmacaoPagamento.moeda,
        });
      }
    }
    return { encontrado: true, empresaId: pagamento.empresa_id };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

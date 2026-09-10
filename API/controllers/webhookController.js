import crypto from "crypto";
import { getDebitoWebhookSecret } from "../config/payment.js";
import { processarWebhookPagamento } from "../services/payment/paymentService.js";

const assinaturaValida = (corpo, assinatura, segredo) => {
  if (!assinatura || !segredo) return false;
  const esperado = crypto.createHmac("sha256", segredo).update(corpo).digest("hex");
  const recebido = assinatura.startsWith("sha256=") ? assinatura.slice(7) : assinatura;
  const atual = Buffer.from(recebido, "utf8");
  const correto = Buffer.from(esperado, "utf8");
  return atual.length === correto.length && crypto.timingSafeEqual(atual, correto);
};

const eventos = { "payment.completed": "payment.success", "payment.success": "payment.success", "payment.failed": "payment.failed", "payment.refunded": "payment.refunded" };

export const receberDebito = async (req, res) => {
  const corpo = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  if (!assinaturaValida(corpo, req.get("x-debitopay-signature"), getDebitoWebhookSecret())) return res.status(401).json({ sucesso: false, erro: "Assinatura do webhook inválida." });
  try {
    const payload = JSON.parse(corpo.toString("utf8"));
    const tipo = payload.event || payload.type;
    const providerId = payload.data?.debito_reference || payload.debito_reference || payload.data?.id || payload.data?.payment_id || payload.data?.transaction_id || payload.payment_id;
    if (!eventos[tipo] || !providerId) return res.status(400).json({ sucesso: false, erro: "Evento da Débito inválido." });
    const resultado = await processarWebhookPagamento({ providerId: String(providerId), event: eventos[tipo], payload, gateway: "debito" });
    if (!resultado.encontrado) console.warn("Webhook Débito sem pagamento local:", providerId);
    return res.status(200).json({ sucesso: true });
  } catch (error) {
    if (error instanceof SyntaxError) return res.status(400).json({ sucesso: false, erro: "Webhook contém JSON inválido." });
    console.error("Erro ao processar webhook Débito:", error.message);
    return res.status(500).json({ sucesso: false, erro: "Não foi possível processar o webhook." });
  }
};

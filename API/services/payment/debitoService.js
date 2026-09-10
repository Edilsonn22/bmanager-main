import { getDebitoConfig } from "../../config/payment.js";

const pedido = async (path, options = {}) => {
  const { baseUrl, apiToken } = getDebitoConfig();
  let resposta;
  try {
    resposta = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiToken}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    const timeout = error?.name === "TimeoutError" || error?.name === "AbortError";
    const causeCode = error?.cause?.code || error?.code || null;
    console.error("Falha de rede na Débito:", { tipo: error?.name, codigo: causeCode });
    const falha = new Error(timeout
      ? "A Débito demorou demasiado para responder. Confirme antes de tentar novamente."
      : "Não foi possível ligar à Débito. Tente novamente dentro de alguns instantes.");
    falha.code = timeout ? "DEBITO_TIMEOUT" : "DEBITO_UNAVAILABLE";
    falha.details = { causeCode };
    throw falha;
  }
  const texto = await resposta.text();
  let dados;
  try { dados = texto ? JSON.parse(texto) : {}; } catch { dados = { message: texto }; }
  if (!resposta.ok) {
    const detalhe = dados?.message || dados?.erro;
    const mensagens = {
      401: "A Débito recusou as credenciais. Confirme DEBITO_API_TOKEN.",
      403: "A carteira Débito não tem permissão para esta operação.",
      404: "A Débito não encontrou o recurso solicitado. Confirme DEBITO_BASE_URL, DEBITO_MERCHANT_ID e DEBITO_WALLET_CODE.",
      422: detalhe || "A Débito rejeitou os dados do pagamento.",
    };
    const erro = new Error(mensagens[resposta.status] || detalhe || "Não foi possível comunicar com a Débito.");
    erro.code = "DEBITO_PROVIDER_ERROR";
    erro.providerStatus = resposta.status;
    erro.details = dados;
    throw erro;
  }
  return dados;
};

export const criarPagamento = async ({ amount, method, phone, customerName, customerEmail }) => {
  const { merchantId, walletCode } = getDebitoConfig();
  if (!new Set(["mpesa", "emola"]).has(method)) throw new Error("Método Débito não suportado.");
  return pedido("/payment-orchestrator", {
    method: "POST",
    body: JSON.stringify({
      action: "process",
      payment_method: method,
      merchant_id: merchantId,
      wallet_code: walletCode,
      amount: Number(amount),
      currency: "MZN",
      phone,
      customer_name: customerName,
      customer_email: customerEmail,
      source: "api_integration",
    }),
  });
};

export const obterPagamento = async (paymentId) => pedido("/payment-orchestrator", {
  method: "POST",
  body: JSON.stringify({ action: "check-status", payment_id: paymentId }),
});

export const normalizarPagamento = (dados) => ({
  id: dados.payment_id || dados.debito_reference || dados.reference || dados.transaction_id
    ? String(dados.payment_id || dados.debito_reference || dados.reference || dados.transaction_id)
    : null,
  transaction_id: dados.transaction_id ?? null,
  status: String(dados.status || "PENDING").toUpperCase(),
  message: dados.message || "Pedido de pagamento enviado ao telemóvel.",
  checkout_url: dados.checkout_url || dados.redirect_url || null,
  provider: dados,
});

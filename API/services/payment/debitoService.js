import { getDebitoConfig } from "../../config/payment.js";

const pedido = async (path, options = {}) => {
  const { baseUrl, apiToken } = getDebitoConfig();
  const resposta = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(20_000),
  });
  const texto = await resposta.text();
  let dados;
  try { dados = texto ? JSON.parse(texto) : {}; } catch { dados = { message: texto }; }
  if (!resposta.ok) {
    const detalhe = dados?.message || dados?.erro;
    const mensagens = {
      401: "A Débito recusou as credenciais. Confirme DEBITO_API_TOKEN.",
      403: "A carteira Débito não tem permissão para esta operação.",
      404: "A Débito não encontrou a carteira ou o endpoint configurado. Confirme DEBITO_BASE_URL e DEBITO_WALLET_ID.",
      422: detalhe || "A Débito rejeitou os dados do pagamento.",
    };
    const erro = new Error(mensagens[resposta.status] || detalhe || "Não foi possível comunicar com a Débito.");
    erro.providerStatus = resposta.status;
    erro.details = dados;
    throw erro;
  }
  return dados;
};

export const criarPagamento = async ({ amount, method, phone, description, reference }) => {
  const { walletId } = getDebitoConfig();
  if (!new Set(["mpesa", "emola"]).has(method)) throw new Error("Método Débito não suportado.");
  return pedido(`/wallets/${encodeURIComponent(walletId)}/c2b/${method}`, {
    method: "POST",
    body: JSON.stringify({ msisdn: phone, amount: Number(amount), reference_description: description, internal_notes: reference }),
  });
};

export const obterPagamento = async (debitoReference) =>
  pedido(`/transactions/${encodeURIComponent(debitoReference)}/status`);

export const normalizarPagamento = (dados) => ({
  id: String(dados.debito_reference || dados.reference || dados.transaction_id),
  transaction_id: dados.transaction_id ?? null,
  status: String(dados.status || "PENDING").toUpperCase(),
  message: dados.message || "Pedido de pagamento enviado ao telemóvel.",
  checkout_url: dados.checkout_url || dados.redirect_url || null,
  provider: dados,
});

const obrigatoria = (nome, valor) => {
  if (!valor) throw new Error(`Variável de ambiente obrigatória não configurada: ${nome}`);
  return valor;
};

const semBarraFinal = (url) => url?.replace(/\/+$/, "");

export const getDebitoConfig = () => ({
  baseUrl: semBarraFinal(process.env.DEBITO_BASE_URL) || "https://my.debito.co.mz/api/v1",
  apiToken: obrigatoria("DEBITO_API_TOKEN", process.env.DEBITO_API_TOKEN),
  walletId: obrigatoria("DEBITO_WALLET_ID", process.env.DEBITO_WALLET_ID),
  callbackUrl: process.env.DEBITO_CALLBACK_URL || null,
});

export const getDebitoWebhookSecret = () => process.env.DEBITO_WEBHOOK_SECRET;

export default { getDebitoConfig, getDebitoWebhookSecret };

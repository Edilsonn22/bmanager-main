const obrigatoria = (nome, valor) => {
  if (!valor) throw new Error(`Variável de ambiente obrigatória não configurada: ${nome}`);
  return valor;
};

const semBarraFinal = (url) => url?.replace(/\/+$/, "");

export const debitoConfigurado = (env = process.env) =>
  Boolean(env.DEBITO_API_TOKEN?.trim() && env.DEBITO_MERCHANT_ID?.trim() && env.DEBITO_WALLET_CODE?.trim());

export const getDebitoConfig = () => ({
  baseUrl: semBarraFinal(process.env.DEBITO_BASE_URL) || "https://gyqoaningqhurhvdugne.supabase.co/functions/v1",
  apiToken: obrigatoria("DEBITO_API_TOKEN", process.env.DEBITO_API_TOKEN),
  merchantId: obrigatoria("DEBITO_MERCHANT_ID", process.env.DEBITO_MERCHANT_ID),
  walletCode: obrigatoria("DEBITO_WALLET_CODE", process.env.DEBITO_WALLET_CODE),
  callbackUrl: process.env.DEBITO_CALLBACK_URL || null,
});

export const getDebitoWebhookSecret = () => process.env.DEBITO_WEBHOOK_SECRET;

export default { debitoConfigurado, getDebitoConfig, getDebitoWebhookSecret };

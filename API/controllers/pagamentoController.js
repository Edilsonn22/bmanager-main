import { criarPagamento, normalizarPagamento, obterPagamento } from "../services/payment/debitoService.js";
import { obterPagamentoDaEmpresa, obterPlanoAtivo, processarWebhookPagamento, registrarPagamentoPendente } from "../services/payment/paymentService.js";
import { debitoConfigurado } from "../config/payment.js";

const METHODS = new Set(["mpesa", "emola"]);
const estadosPagos = new Set(["COMPLETED", "COMPLETE", "SUCCESS", "SUCCESSFUL", "PAID", "APPROVED"]);
const estadosFalhos = new Set(["FAILED", "FAILURE", "DECLINED", "CANCELLED", "CANCELED", "EXPIRED"]);
const normalizarTelefone = (valor) => {
  let telefone = String(valor || "").replace(/\D/g, "");
  if (telefone.startsWith("00258")) telefone = telefone.slice(5);
  else if (telefone.startsWith("258")) telefone = telefone.slice(3);
  if (telefone.length === 10 && telefone.startsWith("0")) telefone = telefone.slice(1);
  return telefone;
};
const telefoneValido = (valor) => /^8[2-7]\d{7}$/.test(normalizarTelefone(valor));
const telefoneDoMetodoValido = (valor, metodo) => {
  const telefone = normalizarTelefone(valor);
  return metodo === "mpesa" ? /^8[45]\d{7}$/.test(telefone) : /^8[67]\d{7}$/.test(telefone);
};

export const configuracao = (_req, res) => res.json({
  sucesso: true,
  gateway: {
    provider: "debito",
    configurado: debitoConfigurado(),
    metodos: ["mpesa", "emola"],
  },
});

export const criar = async (req, res) => {
  const { planoId, method, phone, description } = req.body ?? {};
  const planoIdNumber = Number(planoId);
  if (!Number.isInteger(planoIdNumber) || planoIdNumber <= 0) return res.status(400).json({ sucesso: false, erro: "Selecione um plano válido." });
  if (!METHODS.has(method)) return res.status(400).json({ sucesso: false, erro: "Escolha M-Pesa ou eMola." });
  if (!telefoneValido(phone)) return res.status(400).json({ sucesso: false, erro: "Informe um número moçambicano válido." });
  if (!telefoneDoMetodoValido(phone, method)) return res.status(400).json({ sucesso: false, erro: method === "mpesa" ? "Para M-Pesa, informe um número iniciado por 84 ou 85." : "Para eMola, informe um número iniciado por 86 ou 87." });
  if (description && (typeof description !== "string" || description.length > 125)) return res.status(400).json({ sucesso: false, erro: "A descrição deve ter no máximo 125 caracteres." });

  if (!debitoConfigurado()) return res.status(503).json({
    sucesso: false,
    codigo: "PAYMENT_GATEWAY_NOT_CONFIGURED",
    erro: "Os pagamentos online ainda não estão configurados.",
  });

  try {
    const plano = await obterPlanoAtivo(planoIdNumber);
    if (!plano) return res.status(404).json({ sucesso: false, erro: "Plano não encontrado." });
    if (Number(plano.preco) <= 0) return res.status(409).json({ sucesso: false, erro: "O teste gratuito está disponível apenas no primeiro registo e não requer pagamento." });
    const reference = `BM-${req.user.empresa_id}-${Date.now()}`;
    const respostaDebito = await criarPagamento({
      amount: plano.preco,
      method,
      phone: `258${normalizarTelefone(phone)}`,
      customerName: req.user.nome,
      customerEmail: req.user.email,
    });
    const pagamento = normalizarPagamento(respostaDebito);
    if (!pagamento.id) throw new Error("A Débito não devolveu a referência da transação.");
    await registrarPagamentoPendente({
      empresaId: req.user.empresa_id, usuarioId: req.user.id, planoId: plano.id,
      providerId: pagamento.id, referencia: reference, valor: plano.preco,
      checkoutUrl: pagamento.checkout_url, method,
      descricao: description || `Assinatura ${plano.nome}`, payload: respostaDebito, gateway: "debito",
    });
    return res.status(201).json({ sucesso: true, pagamento });
  } catch (error) {
    console.error("Erro ao criar pagamento Débito:", error.details || error.message);
    const status = error.code === "DEBITO_TIMEOUT" ? 504 : 502;
    return res.status(status).json({
      sucesso: false,
      codigo: error.code || "DEBITO_GATEWAY_ERROR",
      erro: error.message || "Não foi possível criar o pagamento.",
      detalhe_tecnico: error.details?.causeCode || null,
    });
  }
};

export const obter = async (req, res) => {
  try {
    const local = await obterPagamentoDaEmpresa(req.user.empresa_id, req.params.id);
    if (!local) return res.status(404).json({ sucesso: false, erro: "Pagamento não encontrado." });
    const provider = await obterPagamento(req.params.id);
    const estado = String(provider.status || provider.transaction_status || "PENDING").toUpperCase();
    if (estadosPagos.has(estado)) await processarWebhookPagamento({ providerId: req.params.id, event: "payment.success", payload: provider, gateway: "debito" });
    else if (estadosFalhos.has(estado)) await processarWebhookPagamento({ providerId: req.params.id, event: "payment.failed", payload: provider, gateway: "debito" });
    const atualizado = await obterPagamentoDaEmpresa(req.user.empresa_id, req.params.id);
    return res.json({ sucesso: true, pagamento: { ...atualizado, provider } });
  } catch (error) {
    console.error("Erro ao consultar pagamento Débito:", error.details || error.message);
    return res.status(502).json({ sucesso: false, codigo: "DEBITO_GATEWAY_ERROR", erro: error.message || "Não foi possível consultar o pagamento." });
  }
};

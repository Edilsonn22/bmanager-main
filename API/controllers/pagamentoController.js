import { criarPagamento, normalizarPagamento, obterPagamento } from "../services/payment/debitoService.js";
import { obterPagamentoDaEmpresa, obterPlanoAtivo, processarWebhookPagamento, registrarPagamentoPendente } from "../services/payment/paymentService.js";

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

export const criar = async (req, res) => {
  const { planoId, method, phone, description } = req.body ?? {};
  const planoIdNumber = Number(planoId);
  if (!Number.isInteger(planoIdNumber) || planoIdNumber <= 0) return res.status(400).json({ sucesso: false, erro: "Selecione um plano válido." });
  if (!METHODS.has(method)) return res.status(400).json({ sucesso: false, erro: "Escolha M-Pesa ou eMola." });
  if (!telefoneValido(phone)) return res.status(400).json({ sucesso: false, erro: "Informe um número moçambicano válido." });
  if (description && (typeof description !== "string" || description.length > 125)) return res.status(400).json({ sucesso: false, erro: "A descrição deve ter no máximo 125 caracteres." });

  try {
    const plano = await obterPlanoAtivo(planoIdNumber);
    if (!plano) return res.status(404).json({ sucesso: false, erro: "Plano não encontrado." });
    const reference = `BM-${req.user.empresa_id}-${Date.now()}`;
    const respostaDebito = await criarPagamento({
      amount: plano.preco, method, phone: normalizarTelefone(phone), reference,
      description: description || `Assinatura ${plano.nome}`,
    });
    const pagamento = normalizarPagamento(respostaDebito);
    if (!pagamento.id || pagamento.id === "undefined") throw new Error("A Débito não devolveu a referência da transação.");
    await registrarPagamentoPendente({
      empresaId: req.user.empresa_id, usuarioId: req.user.id, planoId: plano.id,
      providerId: pagamento.id, referencia: reference, valor: plano.preco,
      checkoutUrl: pagamento.checkout_url, method,
      descricao: description || `Assinatura ${plano.nome}`, payload: respostaDebito, gateway: "debito",
    });
    return res.status(201).json({ sucesso: true, pagamento });
  } catch (error) {
    console.error("Erro ao criar pagamento Débito:", error.details || error.message);
    return res.status(502).json({ sucesso: false, codigo: "DEBITO_GATEWAY_ERROR", erro: error.message || "Não foi possível criar o pagamento." });
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

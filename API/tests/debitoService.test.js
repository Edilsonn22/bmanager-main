import assert from "node:assert/strict";
import test from "node:test";
import { debitoConfigurado } from "../config/payment.js";
import { criarPagamento, normalizarPagamento } from "../services/payment/debitoService.js";

test("configuração da Débito não expõe nem aceita credenciais incompletas", () => {
  assert.equal(debitoConfigurado({}), false);
  assert.equal(debitoConfigurado({ DEBITO_API_TOKEN: "token", DEBITO_MERCHANT_ID: "merchant", DEBITO_WALLET_CODE: "wallet" }), true);
});

test("normalização rejeitável mantém identificador ausente como null", () => {
  assert.equal(normalizarPagamento({ status: "pending" }).id, null);
  assert.equal(normalizarPagamento({ debito_reference: "DBT-1", status: "pending" }).id, "DBT-1");
});

test("pedido C2B usa endpoint e contrato documentados", async (t) => {
  const fetchOriginal = global.fetch;
  const envOriginal = { ...process.env };
  process.env.DEBITO_BASE_URL = "https://gateway.teste/functions/v1";
  process.env.DEBITO_API_TOKEN = "token-teste";
  process.env.DEBITO_MERCHANT_ID = "merchant-uuid";
  process.env.DEBITO_WALLET_CODE = "wallet-mzn";
  t.after(() => {
    global.fetch = fetchOriginal;
    process.env = envOriginal;
  });

  global.fetch = async (url, options) => {
    assert.equal(url, "https://gateway.teste/functions/v1/payment-orchestrator");
    assert.equal(options.headers.Authorization, "Bearer token-teste");
    assert.deepEqual(JSON.parse(options.body), {
      action: "process",
      payment_method: "mpesa",
      merchant_id: "merchant-uuid",
      wallet_code: "wallet-mzn",
      amount: 500,
      currency: "MZN",
      phone: "258851234567",
      customer_name: "Cliente Teste",
      customer_email: "cliente@teste.local",
      source: "api_integration",
    });
    return new Response(JSON.stringify({ success: true, payment_id: "DBT-1", status: "pending" }), { status: 200 });
  };

  const resposta = await criarPagamento({ amount: 500, method: "mpesa", phone: "258851234567", customerName: "Cliente Teste", customerEmail: "cliente@teste.local" });
  assert.equal(resposta.payment_id, "DBT-1");
});

import assert from "node:assert/strict";
import test from "node:test";

test("e-mails transacionais enviam conteúdo UTF-8 e escapam dados do utilizador", async () => {
  const fetchOriginal = global.fetch;
  const ambienteOriginal = { chave: process.env.RESEND_API_KEY, remetente: process.env.EMAIL_FROM };
  let pedido;
  process.env.RESEND_API_KEY = "chave-de-teste";
  process.env.EMAIL_FROM = "Vendai <teste@vendai.local>";
  global.fetch = async (_url, opcoes) => {
    pedido = opcoes;
    return { ok: true };
  };

  try {
    const { enviarBoasVindas, enviarRecuperacaoSenha, enviarConfirmacaoPagamento, enviarAvisoExpiracao } = await import("../services/emailService.js");
    await enviarBoasVindas({ para: "cliente@teste.local", nome: "Ana <script>", empresa: "Loja & Filhos" });
    const boasVindas = JSON.parse(pedido.body);
    assert.equal(boasVindas.subject, "Bem-vindo à Vendai");
    assert.match(boasVindas.html, /Olá, Ana &lt;script&gt;/);
    assert.match(boasVindas.html, /Loja &amp; Filhos/);

    await enviarRecuperacaoSenha({ para: "cliente@teste.local", link: "https://app.local/redefinir?x=1&y=2" });
    assert.match(JSON.parse(pedido.body).html, /Recupere a sua senha/);
    await enviarConfirmacaoPagamento({ para: "cliente@teste.local", plano: "Básico", valor: "500,00" });
    assert.match(JSON.parse(pedido.body).html, /Pagamento confirmado/);
    await enviarAvisoExpiracao({ para: "cliente@teste.local", plano: "Básico", data: "2030-01-01" });
    assert.equal(JSON.parse(pedido.body).subject, "A sua assinatura está a expirar");
  } finally {
    global.fetch = fetchOriginal;
    if (ambienteOriginal.chave === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = ambienteOriginal.chave;
    if (ambienteOriginal.remetente === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = ambienteOriginal.remetente;
  }
});

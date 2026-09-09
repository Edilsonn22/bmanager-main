import assert from "node:assert/strict";
import test from "node:test";

test("e-mails transacionais SMTP enviam conteúdo UTF-8 e escapam dados do utilizador", async () => {
  const nomes = ["NODE_ENV", "SMTP_JSON_TRANSPORT", "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"];
  const original = Object.fromEntries(nomes.map((nome) => [nome, process.env[nome]]));
  Object.assign(process.env, {
    NODE_ENV: "test",
    SMTP_JSON_TRANSPORT: "true",
    SMTP_HOST: "smtp.teste.local",
    SMTP_USER: "utilizador",
    SMTP_PASSWORD: "senha",
    EMAIL_FROM: "Vendai <teste@vendai.local>",
  });

  try {
    const { enviarBoasVindas, enviarRecuperacaoSenha, enviarConfirmacaoPagamento, enviarAvisoExpiracao } = await import("../services/emailService.js");
    const boasVindas = await enviarBoasVindas({ para: "cliente@teste.local", nome: "Ana <script>", empresa: "Loja & Filhos" });
    const mensagemBoasVindas = JSON.parse(boasVindas.conteudoTeste.toString());
    assert.equal(mensagemBoasVindas.subject, "Bem-vindo à Vendai");
    assert.match(mensagemBoasVindas.html, /Olá, Ana &lt;script&gt;/);
    assert.match(mensagemBoasVindas.html, /Loja &amp; Filhos/);

    const recuperacao = await enviarRecuperacaoSenha({ para: "cliente@teste.local", link: "https://app.local/redefinir?x=1&y=2" });
    assert.match(JSON.parse(recuperacao.conteudoTeste.toString()).html, /Recupere a sua senha/);
    const pagamento = await enviarConfirmacaoPagamento({ para: "cliente@teste.local", plano: "Básico", valor: "500,00" });
    assert.match(JSON.parse(pagamento.conteudoTeste.toString()).html, /Pagamento confirmado/);
    const expiracao = await enviarAvisoExpiracao({ para: "cliente@teste.local", plano: "Básico", data: "2030-01-01" });
    assert.equal(JSON.parse(expiracao.conteudoTeste.toString()).subject, "A sua assinatura está a expirar");
  } finally {
    for (const nome of nomes) {
      if (original[nome] === undefined) delete process.env[nome];
      else process.env[nome] = original[nome];
    }
  }
});

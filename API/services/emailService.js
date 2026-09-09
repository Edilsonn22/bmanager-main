const escaparHtml = (valor = "") => String(valor)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const layout = (titulo, conteudo) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1e293b">
    <h1 style="color:#4f46e5">Vendai</h1>
    <h2>${escaparHtml(titulo)}</h2>
    ${conteudo}
    <p style="margin-top:32px;color:#64748b;font-size:13px">Esta é uma mensagem automática da Vendai.</p>
  </div>`;

const criarTransportador = () => {
  if (process.env.NODE_ENV === "test" && process.env.SMTP_JSON_TRANSPORT === "true") {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  const porta = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: porta,
    secure: process.env.SMTP_SECURE === "true" || porta === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
};

export const enviarEmail = async ({ para, assunto, html }) => {
  const host = process.env.SMTP_HOST;
  const usuario = process.env.SMTP_USER;
  const senha = process.env.SMTP_PASSWORD;
  const remetente = process.env.EMAIL_FROM;
  if (!host || !usuario || !senha || !remetente) {
    console.warn("E-mail não enviado: configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD e EMAIL_FROM.");
    return { enviado: false, motivo: "nao_configurado" };
  }
  const transportador = criarTransportador();
  const info = await transportador.sendMail({ from: remetente, to: para, subject: assunto, html });
  return {
    enviado: true,
    messageId: info.messageId,
    ...(process.env.NODE_ENV === "test" ? { conteudoTeste: info.message } : {}),
  };
};

export const verificarSMTP = async () => {
  const obrigatorias = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"];
  const ausentes = obrigatorias.filter((nome) => !process.env[nome]?.trim());
  if (ausentes.length) throw new Error(`Configuração incompleta: ${ausentes.join(", ")}`);
  if (!/^.+<[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>$/.test(process.env.EMAIL_FROM) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.EMAIL_FROM)) {
    throw new Error("EMAIL_FROM deve conter um endereço de e-mail válido.");
  }
  const transportador = criarTransportador();
  await transportador.verify();
  return true;
};

export const enviarEmailSeguro = async (dados) => {
  try {
    return await enviarEmail(dados);
  } catch (error) {
    console.error("Erro ao enviar e-mail pelo SMTP:", error.message);
    return { enviado: false, motivo: "falha_no_provedor" };
  }
};

export const enviarBoasVindas = ({ para, nome, empresa }) => enviarEmailSeguro({
  para,
  assunto: "Bem-vindo à Vendai",
  html: layout("Conta criada com sucesso", `<p>Olá, ${escaparHtml(nome)}.</p><p>A empresa <strong>${escaparHtml(empresa)}</strong> está pronta. O seu período de teste gratuito já está ativo.</p>`),
});

export const enviarRecuperacaoSenha = ({ para, link }) => enviarEmailSeguro({
  para,
  assunto: "Recuperação de senha da Vendai",
  html: layout("Recupere a sua senha", `<p>Recebemos um pedido para redefinir a sua senha.</p><p><a style="display:inline-block;padding:12px 18px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px" href="${escaparHtml(link)}">Redefinir senha</a></p><p>Este link expira em 30 minutos. Se não solicitou esta alteração, ignore este e-mail.</p>`),
});

export const enviarConfirmacaoPagamento = ({ para, plano, valor, moeda = "MZN" }) => enviarEmailSeguro({
  para,
  assunto: "Pagamento confirmado",
  html: layout("Pagamento confirmado", `<p>O pagamento do plano <strong>${escaparHtml(plano)}</strong> foi confirmado.</p><p>Total: <strong>${escaparHtml(valor)} ${escaparHtml(moeda)}</strong>.</p><p>A sua assinatura está ativa.</p>`),
});

export const enviarAvisoExpiracao = ({ para, plano, data }) => enviarEmailSeguro({
  para,
  assunto: "A sua assinatura está a expirar",
  html: layout("Renove a sua assinatura", `<p>O plano <strong>${escaparHtml(plano)}</strong> expira em <strong>${escaparHtml(data)}</strong>.</p><p>Entre na Vendai para renovar e manter o acesso sem interrupções.</p>`),
});
import nodemailer from "nodemailer";

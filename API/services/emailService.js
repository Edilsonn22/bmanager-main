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

export const enviarEmail = async ({ para, assunto, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.EMAIL_FROM;
  if (!apiKey || !remetente) {
    console.warn("E-mail não enviado: configure RESEND_API_KEY e EMAIL_FROM.");
    return { enviado: false, motivo: "nao_configurado" };
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "User-Agent": "bmanager/1.0" },
    body: JSON.stringify({ from: remetente, to: [para], subject: assunto, html }),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || "Falha ao enviar e-mail.");
  return { enviado: true };
};

export const enviarEmailSeguro = async (dados) => {
  try {
    return await enviarEmail(dados);
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${dados.para}:`, error.message);
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

import dotenv from "dotenv";
import { enviarEmail, verificarSMTP } from "../services/emailService.js";

dotenv.config();

const destino = process.argv[2] || process.env.SMTP_TEST_TO || process.env.SMTP_USER;

try {
  await verificarSMTP();
  console.log("Ligação e autenticação SMTP validadas.");
  if (destino) {
    const resultado = await enviarEmail({
      para: destino,
      assunto: "Teste SMTP da Vendai",
      html: "<p>O envio SMTP da Vendai está configurado corretamente.</p>",
    });
    if (!resultado.enviado) throw new Error("Configuração SMTP incompleta.");
    console.log("E-mail de teste enviado.");
  }
} catch (error) {
  console.error("Falha na configuração SMTP:", error.message);
  process.exitCode = 1;
}

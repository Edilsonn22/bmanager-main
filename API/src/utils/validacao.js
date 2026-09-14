const FORMATO_EMAIL = /^[^\s@.]+(?:\.[^\s@.]+)*@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,63}$/i;

export const emailValido = (valor) => {
  if (typeof valor !== "string") return false;
  const email = valor.trim();
  const [parteLocal = ""] = email.split("@");
  return email.length <= 254 && parteLocal.length <= 64 && FORMATO_EMAIL.test(email);
};

export const noveDigitos = (valor) => /^\d{9}$/.test(String(valor || "").trim());

export const validarContactosOpcionais = ({ email, telefone, contacto, nuit } = {}) => {
  if (String(email || "").trim() && !emailValido(email)) return "Informe um endereço de e-mail válido.";
  if (String(telefone || "").trim() && !noveDigitos(telefone)) return "O número de telefone deve ter exatamente 9 dígitos.";
  if (String(contacto || "").trim() && !noveDigitos(contacto)) return "O contacto deve ter exatamente 9 dígitos.";
  if (String(nuit || "").trim() && !noveDigitos(nuit)) return "O NUIT deve ter exatamente 9 dígitos.";
  return null;
};

const placeholders = ["gere_um_segredo", "seu_segredo", "changeme", "example"];

export function validarAmbienteProducao(env = process.env) {
  if (env.NODE_ENV !== "production") return;

  const obrigatorias = ["CLIENT_URL", "JWT_SECRET", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const ausentes = obrigatorias.filter((nome) => !env[nome]?.trim());
  if (ausentes.length) throw new Error(`Variáveis obrigatórias ausentes: ${ausentes.join(", ")}`);

  if (env.JWT_SECRET.length < 32 || placeholders.some((item) => env.JWT_SECRET.toLowerCase().includes(item))) {
    throw new Error("JWT_SECRET deve ser aleatório, não conter exemplos e possuir pelo menos 32 caracteres.");
  }

  const clientUrl = new URL(env.CLIENT_URL);
  if (clientUrl.protocol !== "https:") throw new Error("CLIENT_URL deve utilizar HTTPS em produção.");
}

const registros = new Map();

export const limparRateLimits = () => registros.clear();

export const criarRateLimit = ({ janelaMs, maximo, mensagem }) => (req, res, next) => {
  const agora = Date.now();
  const chave = `${req.path}:${req.ip}`;
  const registro = registros.get(chave) || { tentativas: 0, reiniciaEm: agora + janelaMs };
  if (agora >= registro.reiniciaEm) {
    registro.tentativas = 0;
    registro.reiniciaEm = agora + janelaMs;
  }
  registro.tentativas += 1;
  registros.set(chave, registro);
  if (registro.tentativas > maximo) {
    res.set("Retry-After", String(Math.ceil((registro.reiniciaEm - agora) / 1000)));
    return res.status(429).json({ message: mensagem, sucesso: false });
  }
  return next();
};

export const limiteLogin = criarRateLimit({ janelaMs: 15 * 60 * 1000, maximo: 10, mensagem: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente." });
export const limiteRecuperacao = criarRateLimit({ janelaMs: 60 * 60 * 1000, maximo: 3, mensagem: "Muitos pedidos de recuperação. Aguarde uma hora." });
export const limiteWebhook = criarRateLimit({ janelaMs: 60 * 1000, maximo: 120, mensagem: "Limite de webhooks excedido." });

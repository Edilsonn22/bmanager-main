const metodosComCorpo = new Set(["POST", "PUT", "PATCH"]);

// Garante um corpo JSON simples antes de qualquer controlador receber dados.
// As validações de campos específicos permanecem nos respetivos controladores.
export const validarCorpoJson = (req, res, next) => {
  if (!metodosComCorpo.has(req.method) || req.path.startsWith("/api/webhooks")) return next();
  const temCorpo = Number(req.headers["content-length"] || 0) > 0 || Boolean(req.headers["transfer-encoding"]);
  if (!temCorpo) return next();
  const tipo = req.headers["content-type"] || "";
  if (!tipo.includes("application/json")) {
    return res.status(415).json({ message: "Envie os dados no formato application/json." });
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ message: "O corpo da solicitação deve ser um objeto JSON válido." });
  }
  return next();
};

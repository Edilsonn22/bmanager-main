export const ehPlatformAdmin = (usuario) => usuario?.tipo_conta === "platform_owner";

export const platformAdmin = (req, res, next) => {
  if (!ehPlatformAdmin(req.user)) {
    return res.status(403).json({ sucesso: false, erro: "Acesso restrito à administração da plataforma." });
  }
  return next();
};

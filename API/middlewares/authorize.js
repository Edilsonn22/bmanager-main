import { temPermissaoNoModulo } from "../config/permissions.js";

export const authorize = (...roles) => {

  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        message: "Não autenticado"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Você não tem permissão para realizar esta ação"
      });
    }

    next();
  };

};

export const authorizeModule = (modulo) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Não autenticado." });
  if (!temPermissaoNoModulo(req.user.role, modulo)) {
    return res.status(403).json({ message: `Não tem permissão para aceder ao módulo ${modulo}.` });
  }
  return next();
};

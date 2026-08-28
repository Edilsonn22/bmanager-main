import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const auth = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ message: "Token ausente." });
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Token inválido." });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    const message = error.name === "TokenExpiredError"
      ? "Sessão expirada. Faça login novamente."
      : "Token inválido.";
    return res.status(401).json({ message });
  }

  try {
    req.user = decoded;

    if (decoded.tipo_conta !== "platform_owner") {
      const [empresas] = await pool.execute(
        `SELECT e.bloqueada, e.session_version, u.token_version
         FROM Empresa e INNER JOIN Usuario u ON u.empresa_id = e.id
         WHERE e.id = ? AND u.id = ?`,
        [decoded.empresa_id, decoded.id],
      );

      if (!empresas[0]) return res.status(401).json({ message: "Sessão inválida." });
      if (Number(decoded.token_version || 0) !== Number(empresas[0].token_version) || Number(decoded.empresa_session_version || 0) !== Number(empresas[0].session_version)) {
        return res.status(401).json({ message: "Sessão revogada. Faça login novamente." });
      }
      if (empresas[0]?.bloqueada) {
        return res.status(403).json({
          message: "A empresa está bloqueada. Contacte o suporte.",
        });
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

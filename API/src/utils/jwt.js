import jwt from "jsonwebtoken";

export const gerarToken = (usuario) => {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      empresa_id: usuario.empresa_id,
      role: usuario.role,
      tipo_conta: usuario.tipo_conta || "empresa",
      token_version: usuario.token_version || 0,
      empresa_session_version: usuario.empresa_session_version || 0,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES,
    }
  );
};

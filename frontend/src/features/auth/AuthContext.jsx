/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);
const TOKEN_KEY = "bmanager.token";
const USER_KEY = "bmanager.user";

const limparArmazenamento = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
};

const tokenExpirou = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return !payload.exp || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const lerUsuario = (chave = USER_KEY) => {
  try { return JSON.parse(localStorage.getItem(chave) || "null"); }
  catch { return null; }
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem("token");
    const usuarioGuardado = lerUsuario() || lerUsuario("usuario");

    if (!token || !usuarioGuardado || tokenExpirou(token)) {
      limparArmazenamento();
      return null;
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuarioGuardado));
    return usuarioGuardado;
  });
  const iniciarSessao = ({ token, usuario: dadosUsuario }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(dadosUsuario));
    // Compatibilidade temporária com os ecrãs do painel ainda em migração.
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(dadosUsuario));
    setUsuario(dadosUsuario);
  };
  const terminarSessao = () => {
    limparArmazenamento();
    setUsuario(null);
  };
  useEffect(() => {
    window.addEventListener("bmanager:session-expired", terminarSessao);
    return () => window.removeEventListener("bmanager:session-expired", terminarSessao);
  }, []);
  const value = useMemo(() => ({ usuario, autenticado: Boolean(usuario && localStorage.getItem(TOKEN_KEY)), iniciarSessao, terminarSessao }), [usuario]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}

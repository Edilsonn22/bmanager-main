import { API_URL } from "./authenticatedFetch.js";

export const register = async (dados) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Erro ao criar conta");
  }

  return data;
};

export const login = async (dados) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dados),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Email ou senha inválidos");
  }

  return data;
};

export const getPerfil = async () => {
  const token = localStorage.getItem("bmanager.token");

  const response = await fetch(`${API_URL}/auth/perfil`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Não autenticado");
  }

  return data;
};

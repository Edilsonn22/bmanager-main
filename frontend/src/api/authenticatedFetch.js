export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const TOKEN_KEY = "bmanager.token";
const requisicoesMutaveisEmCurso = new Map();
const METODOS_MUTAVEIS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function obterToken() {
  const tokenAtual = localStorage.getItem(TOKEN_KEY);
  if (tokenAtual) return tokenAtual;

  const tokenLegado = localStorage.getItem("token");
  if (tokenLegado) localStorage.setItem(TOKEN_KEY, tokenLegado);
  return tokenLegado;
}

function ehRequisicaoDaApi(url) {
  return url === API_URL || url.startsWith(`${API_URL}/`);
}

function chaveDaRequisicao(input, init, url) {
  const metodo = String(init.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (!METODOS_MUTAVEIS.has(metodo)) return null;

  const corpo = init.body;
  if (corpo != null && typeof corpo !== "string" && !(corpo instanceof URLSearchParams)) return null;
  return `${metodo}:${url}:${corpo?.toString() || ""}`;
}

export function installAuthenticatedFetch() {
  if (window.__bmanagerAuthenticatedFetchInstalled) return;
  window.__bmanagerAuthenticatedFetchInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    if (!ehRequisicaoDaApi(url)) return originalFetch(input, init);

    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    const token = obterToken();
    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

    const chave = chaveDaRequisicao(input, init, url);
    if (chave && requisicoesMutaveisEmCurso.has(chave)) {
      return (await requisicoesMutaveisEmCurso.get(chave)).clone();
    }

    const executar = originalFetch(input, { ...init, headers }).then((response) => {
      const isAuthEndpoint = new URL(url, window.location.origin).pathname.startsWith("/api/auth/");
      if (response.status === 401 && token && !isAuthEndpoint) {
        window.dispatchEvent(new Event("bmanager:session-expired"));
      }
      return response;
    });

    if (!chave) return executar;
    requisicoesMutaveisEmCurso.set(chave, executar);
    try {
      return (await executar).clone();
    } finally {
      if (requisicoesMutaveisEmCurso.get(chave) === executar) requisicoesMutaveisEmCurso.delete(chave);
    }
  };
}

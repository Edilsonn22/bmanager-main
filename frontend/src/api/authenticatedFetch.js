export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const TOKEN_KEY = "bmanager.token";

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

    const response = await originalFetch(input, { ...init, headers });
    const isAuthEndpoint = new URL(url, window.location.origin).pathname.startsWith("/api/auth/");
    if (response.status === 401 && token && !isAuthEndpoint) {
      window.dispatchEvent(new Event("bmanager:session-expired"));
    }
    return response;
  };
}

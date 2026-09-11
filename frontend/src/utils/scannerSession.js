export const SCANNER_STORAGE_KEY = "vendai.scannerSessao";

export function carregarScannerGuardado() {
  try {
    const sessao = JSON.parse(localStorage.getItem(SCANNER_STORAGE_KEY) || "null");
    if (sessao?.id && sessao?.url && new Date(sessao.expira_em) > new Date()) return sessao;
  } catch {
    // Uma sessão inválida será simplesmente descartada.
  }
  localStorage.removeItem(SCANNER_STORAGE_KEY);
  return null;
}

export function guardarScanner(sessao) {
  localStorage.setItem(SCANNER_STORAGE_KEY, JSON.stringify(sessao));
}

export function removerScanner() {
  localStorage.removeItem(SCANNER_STORAGE_KEY);
}

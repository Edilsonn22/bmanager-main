import { API_URL } from "../api/authenticatedFetch";

export async function otimizarImagemProduto(arquivo) {
  const tipos = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!tipos.has(arquivo?.type)) throw new Error("Escolha uma imagem JPEG, PNG ou WebP.");
  if (arquivo.size > 8 * 1024 * 1024) throw new Error("A imagem original não pode exceder 8 MB.");

  const bitmap = await createImageBitmap(arquivo, { imageOrientation: "from-image" });
  // Normaliza cada upload sem deformar nem cortar a fotografia original.
  const tamanho = 800;
  const margem = 40;
  const areaUtil = tamanho - margem * 2;
  const escala = Math.min(areaUtil / bitmap.width, areaUtil / bitmap.height);
  const largura = Math.max(1, Math.round(bitmap.width * escala));
  const altura = Math.max(1, Math.round(bitmap.height * escala));
  const canvas = document.createElement("canvas");
  canvas.width = tamanho;
  canvas.height = tamanho;

  const contexto = canvas.getContext("2d", { alpha: false });
  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, tamanho, tamanho);
  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = "high";
  contexto.drawImage(
    bitmap,
    Math.round((tamanho - largura) / 2),
    Math.round((tamanho - altura) / 2),
    largura,
    altura,
  );
  bitmap.close?.();

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error("Não foi possível preparar esta imagem.");
  if (blob.size > 1024 * 1024) throw new Error("A imagem continua demasiado grande após a otimização.");
  return blob;
}

export async function guardarImagemProduto(produtoId, imagem) {
  const resposta = await fetch(`${API_URL}/produtos/${produtoId}/imagem`, {
    method: "PUT",
    headers: { "Content-Type": imagem.type || "image/webp" },
    body: imagem,
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || dados.message || "Não foi possível guardar a imagem.");
}

export async function removerImagemProduto(produtoId) {
  const resposta = await fetch(`${API_URL}/produtos/${produtoId}/imagem`, { method: "DELETE" });
  if (!resposta.ok) {
    const dados = await resposta.json();
    throw new Error(dados.erro || "Não foi possível remover a imagem.");
  }
}

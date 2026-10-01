import { useEffect, useState } from "react";
import { API_URL } from "../../api/authenticatedFetch";

export function ProductPhoto({ produtoId, temImagem, alt, className = "" }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!temImagem) return undefined;
    let ativo = true;
    let objectUrl = "";
    fetch(`${API_URL}/produtos/${produtoId}/imagem`)
      .then((resposta) => {
        if (!resposta.ok) throw new Error();
        return resposta.blob();
      })
      .then((blob) => {
        if (!ativo) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {});
    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [produtoId, temImagem]);

  if (!url) return null;
  return <img src={url} alt={alt} className={className} />;
}

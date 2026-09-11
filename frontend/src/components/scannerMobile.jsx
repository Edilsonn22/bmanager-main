import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, CircleCheck, TriangleAlert } from "lucide-react";
import { useParams } from "react-router-dom";
import { API_URL } from "../api/authenticatedFetch";

export default function ScannerMobile() {
  const { token } = useParams();
  const videoRef = useRef(null);
  const ultimo = useRef({ codigo: "", instante: 0 });
  const enviando = useRef(false);
  const enviarCodigoRef = useRef(null);
  const [estado, setEstado] = useState("A iniciar a câmara...");
  const [erro, setErro] = useState("");
  const [enviados, setEnviados] = useState(0);
  const [processandoFoto, setProcessandoFoto] = useState(false);

  useEffect(() => {
    let ativo = true;
    let controlos;
    const leitor = new BrowserMultiFormatReader();

    const enviar = async (codigo) => {
      const agora = Date.now();
      if (enviando.current || (codigo === ultimo.current.codigo && agora - ultimo.current.instante < 1800)) return;
      enviando.current = true;
      ultimo.current = { codigo, instante: agora };
      setErro("");
      setEstado(`A enviar ${codigo}...`);
      try {
        const resposta = await fetch(`${API_URL}/scanner/ligacao/${token}/codigos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo }),
        });
        const dados = await resposta.json();
        if (!resposta.ok) {
          if (resposta.status === 410) controlos?.stop();
          throw new Error(dados.erro || "Não foi possível enviar o código.");
        }
        navigator.vibrate?.(120);
        if (ativo) {
          setEnviados((numero) => numero + 1);
          setEstado(`${codigo} enviado. Pode ler o próximo.`);
        }
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        enviando.current = false;
      }
    };
    enviarCodigoRef.current = enviar;

    const iniciar = async () => {
      try {
        controlos = await leitor.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
          videoRef.current,
          (resultado) => { if (resultado?.getText()) enviar(resultado.getText()); },
        );
        if (ativo) setEstado("Pronto para ler");
        else controlos.stop();
      } catch (error) {
        if (!ativo) return;
        setErro(error.name === "NotAllowedError"
          ? "Autorize o acesso à câmara para continuar."
          : "Não foi possível iniciar a câmara. Confirme as permissões e tente novamente.");
      }
    };

    iniciar();
    return () => {
      ativo = false;
      controlos?.stop();
      enviarCodigoRef.current = null;
    };
  }, [token]);

  const lerFotografia = async (evento) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    const url = URL.createObjectURL(arquivo);
    setProcessandoFoto(true);
    setErro("");
    try {
      const leitor = new BrowserMultiFormatReader();
      const resultado = await leitor.decodeFromImageUrl(url);
      if (!resultado?.getText()) throw new Error("Código não encontrado.");
      await enviarCodigoRef.current?.(resultado.getText());
    } catch {
      setErro(
        "Não foi possível reconhecer o código na fotografia. Aproxime a câmara, mantenha o código direito e tente novamente.",
      );
    } finally {
      URL.revokeObjectURL(url);
      evento.target.value = "";
      setProcessandoFoto(false);
    }
  };

  return (
    <main className="min-h-dvh bg-slate-950 p-3 text-white">
      <section className="mx-auto max-w-lg overflow-hidden rounded-2xl bg-slate-900 shadow-2xl">
        <header className="p-5 text-center">
          <Camera className="mx-auto text-emerald-400" />
          <h1 className="mt-2 text-xl font-bold">Scanner Vendai</h1>
          <p className="text-sm text-slate-400">Os produtos serão enviados para o computador.</p>
        </header>
        <div className="relative aspect-[3/4] overflow-hidden bg-black">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-28 w-4/5 rounded-xl border-2 border-emerald-400 shadow-[0_0_0_999px_rgba(0,0,0,.4)]" />
          </div>
        </div>
        <div className="p-4">
          {erro ? (
            <p className="flex gap-2 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">
              <TriangleAlert className="shrink-0" size={19} />{erro}
            </p>
          ) : (
            <p className="flex gap-2 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200">
              <CircleCheck className="shrink-0" size={19} />{estado}
            </p>
          )}
          <p className="mt-3 text-center text-sm text-slate-400">
            Leituras enviadas: <strong className="text-white">{enviados}</strong>
          </p>
          <label className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-500">
            <Camera size={19} />
            {processandoFoto ? "A reconhecer..." : "Fotografar código"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={processandoFoto}
              onChange={lerFotografia}
              className="sr-only"
            />
          </label>
          <p className="mt-2 text-center text-xs text-slate-500">
            Use esta opção quando o navegador não permitir a leitura contínua.
          </p>
        </div>
      </section>
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { BarcodeFormat, BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, CircleCheck, Download, Smartphone, TriangleAlert } from "lucide-react";
import { useParams } from "react-router-dom";
import { API_URL } from "../api/authenticatedFetch";
import vendaiLogo from "../assets/vendai-logo.png";

export default function ScannerMobile() {
  const { token: tokenRota } = useParams();
  const [token, setToken] = useState(
    () => tokenRota || localStorage.getItem("vendai.scannerToken") || "",
  );
  const videoRef = useRef(null);
  const ultimo = useRef({ codigo: "", instante: 0 });
  const enviando = useRef(false);
  const enviarCodigoRef = useRef(null);
  const [estado, setEstado] = useState("A iniciar a câmara...");
  const [erro, setErro] = useState("");
  const [enviados, setEnviados] = useState(0);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [eventoInstalacao, setEventoInstalacao] = useState(null);
  const [instalado, setInstalado] = useState(
    () => window.matchMedia?.("(display-mode: standalone)").matches || false,
  );

  useEffect(() => {
    if (tokenRota) {
      localStorage.setItem("vendai.scannerToken", tokenRota);
      setToken(tokenRota);
    }
  }, [tokenRota]);

  useEffect(() => {
    const prepararInstalacao = (evento) => {
      evento.preventDefault();
      setEventoInstalacao(evento);
    };
    const confirmarInstalacao = () => {
      setInstalado(true);
      setEventoInstalacao(null);
    };
    window.addEventListener("beforeinstallprompt", prepararInstalacao);
    window.addEventListener("appinstalled", confirmarInstalacao);
    return () => {
      window.removeEventListener("beforeinstallprompt", prepararInstalacao);
      window.removeEventListener("appinstalled", confirmarInstalacao);
    };
  }, []);

  useEffect(() => {
    let ativo = true;
    let controlos;
    let temporizadorNativo;
    let deteccaoNativaEmCurso = false;
    const leitor = new BrowserMultiFormatReader(undefined, {
      delayBetweenScanAttempts: 120,
      delayBetweenScanSuccess: 700,
    });
    leitor.possibleFormats = [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.CODABAR,
    ];

    const enviar = async (codigo) => {
      const agora = Date.now();
      if (enviando.current || (codigo === ultimo.current.codigo && agora - ultimo.current.instante < 1600)) return;
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
          if (resposta.status === 410) {
            controlos?.stop();
            localStorage.removeItem("vendai.scannerToken");
            setToken("");
          }
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

    const iniciarDetetorNativo = async () => {
      if (!("BarcodeDetector" in window)) return;
      try {
        const suportados = await window.BarcodeDetector.getSupportedFormats();
        const formatos = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "codabar"]
          .filter((formato) => suportados.includes(formato));
        if (!formatos.length) return;
        const detector = new window.BarcodeDetector({ formats: formatos });
        const detetar = async () => {
          if (!ativo) return;
          const video = videoRef.current;
          if (video?.readyState >= 2 && !deteccaoNativaEmCurso) {
            deteccaoNativaEmCurso = true;
            try {
              const resultado = (await detector.detect(video))[0]?.rawValue;
              if (resultado) enviar(resultado);
            } catch {
              // O ZXing continua ativo como alternativa.
            } finally {
              deteccaoNativaEmCurso = false;
            }
          }
          temporizadorNativo = window.setTimeout(detetar, 140);
        };
        detetar();
      } catch {
        // O navegador não oferece deteção nativa; o ZXing continua ativo.
      }
    };

    const iniciar = async () => {
      if (!token) return;
      try {
        controlos = await leitor.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } },
          videoRef.current,
          (resultado) => { if (resultado?.getText()) enviar(resultado.getText()); },
        );
        const faixa = videoRef.current?.srcObject?.getVideoTracks?.()[0];
        if (faixa?.getCapabilities && faixa?.applyConstraints) {
          const capacidades = faixa.getCapabilities();
          if (capacidades.focusMode?.includes?.("continuous")) {
            await faixa.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(() => {});
          }
        }
        iniciarDetetorNativo();
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
      window.clearTimeout(temporizadorNativo);
      controlos?.stop();
      enviarCodigoRef.current = null;
    };
  }, [token]);

  const instalar = async () => {
    if (!eventoInstalacao) return;
    await eventoInstalacao.prompt();
    const escolha = await eventoInstalacao.userChoice;
    if (escolha.outcome === "accepted") setInstalado(true);
    setEventoInstalacao(null);
  };

  const lerFotografia = async (evento) => {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    setProcessandoFoto(true);
    setErro("");
    try {
      const imagem = await createImageBitmap(arquivo, {
        imageOrientation: "from-image",
      });

      if ("BarcodeDetector" in window) {
        try {
          const suportados = await window.BarcodeDetector.getSupportedFormats();
          const formatos = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"]
            .filter((formato) => suportados.includes(formato));
          const detector = new window.BarcodeDetector({ formats: formatos });
          const resultadoNativo = (await detector.detect(imagem))[0]?.rawValue;
          if (resultadoNativo) {
            imagem.close();
            await enviarCodigoRef.current?.(resultadoNativo);
            return;
          }
        } catch {
          // Continua com o leitor compatível abaixo.
        }
      }

      const leitor = new BrowserMultiFormatReader();
      const recortes = [
        [0, 0, 1, 1],
        [0.05, 0.15, 0.9, 0.7],
        [0.08, 0.28, 0.84, 0.44],
        [0.15, 0.15, 0.7, 0.7],
      ];
      let codigo = "";

      for (const [x, y, largura, altura] of recortes) {
        const origemLargura = Math.round(imagem.width * largura);
        const origemAltura = Math.round(imagem.height * altura);
        const escala = Math.min(1, 2000 / Math.max(origemLargura, origemAltura));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(origemLargura * escala));
        canvas.height = Math.max(1, Math.round(origemAltura * escala));
        canvas.getContext("2d").drawImage(
          imagem,
          Math.round(imagem.width * x),
          Math.round(imagem.height * y),
          origemLargura,
          origemAltura,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        try {
          codigo = leitor.decodeFromCanvas(canvas).getText();
          if (codigo) break;
        } catch {
          // Experimenta o próximo enquadramento da mesma fotografia.
        }
      }

      imagem.close();
      if (!codigo) throw new Error("Código não encontrado.");
      await enviarCodigoRef.current?.(codigo);
    } catch {
      setErro(
        "Código não reconhecido. Fotografe apenas o código, de perto, na horizontal, com boa luz e sem reflexos.",
      );
    } finally {
      evento.target.value = "";
      setProcessandoFoto(false);
    }
  };

  if (!token) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-950 p-5 text-white">
        <section className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-7 text-center shadow-2xl">
          <div className="mx-auto mb-5 rounded-xl bg-white px-3 py-2">
            <img src={vendaiLogo} alt="Vendai" className="mx-auto h-10 w-auto max-w-36 object-contain" />
          </div>
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <Smartphone size={31} />
          </span>
          <h1 className="mt-5 text-xl font-bold">Vendai Scanner</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Este aparelho ainda não está ligado. No computador, abra uma nova venda, selecione Telemóvel e leia o QR Code uma única vez.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-slate-950 p-3 text-white">
      <section className="mx-auto max-w-lg overflow-hidden rounded-2xl bg-slate-900 shadow-2xl">
        <header className="p-5 text-center">
          <div className="mx-auto mb-4 w-fit rounded-xl bg-white px-3 py-2">
            <img src={vendaiLogo} alt="Vendai" className="h-9 w-auto max-w-32 object-contain" />
          </div>
          <Camera className="mx-auto text-emerald-400" />
          <h1 className="mt-2 text-xl font-bold">Scanner Vendai</h1>
          <p className="text-sm text-slate-400">Os produtos serão enviados para o computador.</p>
          {!instalado && eventoInstalacao && (
            <button
              type="button"
              onClick={instalar}
              className="mx-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-slate-100"
            >
              <Download size={17} /> Instalar aplicativo
            </button>
          )}
          {!instalado && !eventoInstalacao && (
            <p className="mt-3 text-xs text-slate-500">
              Para instalar, abra o menu do navegador e escolha “Adicionar ao ecrã principal”.
            </p>
          )}
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

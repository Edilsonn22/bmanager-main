import { createElement, useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, Boxes, Check, PackagePlus, Sparkles, Tags, Truck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

const passos = [
  {
    icon: Sparkles,
    titulo: "Bem-vindo à Vendai",
    texto: "Vamos mostrar-lhe como organizar a operação da sua empresa em poucos passos.",
    cor: "from-indigo-500 to-violet-500",
  },
  {
    icon: Tags,
    titulo: "1. Crie uma categoria",
    texto: "Organize os produtos por categoria para pesquisar e analisar o stock mais facilmente.",
    destino: "/adicionarCategoria",
    acao: "Criar categoria",
    cor: "from-sky-500 to-indigo-500",
  },
  {
    icon: Truck,
    titulo: "2. Registe um fornecedor",
    texto: "Associe fornecedores aos produtos e mantenha os contactos importantes num só lugar.",
    destino: "/adicionarFornecedor",
    acao: "Registar fornecedor",
    cor: "from-amber-500 to-orange-500",
  },
  {
    icon: PackagePlus,
    titulo: "3. Adicione o primeiro produto",
    texto: "Defina preço, quantidade inicial e nível mínimo para receber alertas de stock.",
    destino: "/adicionarProduto",
    acao: "Adicionar produto",
    cor: "from-violet-500 to-indigo-500",
  },
  {
    icon: BarChart3,
    titulo: "Acompanhe cada movimento",
    texto: "Registe entradas e saídas. O painel e os relatórios são atualizados automaticamente.",
    cor: "from-emerald-500 to-teal-500",
    destino: "/movimentar",
    acao: "Registar movimento",
  },
];

export default function Onboarding() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(() => {
    if (!usuario?.id) return false;
    return localStorage.getItem(`vendai.onboarding.completed.${usuario.id}`) !== "true";
  });
  const [passo, setPasso] = useState(0);
  const dialogRef = useRef(null);
  const chave = usuario?.id ? `vendai.onboarding.completed.${usuario.id}` : null;

  useEffect(() => {
    const reiniciar = () => {
      setPasso(0);
      setAberto(true);
    };
    window.addEventListener("vendai:start-onboarding", reiniciar);
    return () => window.removeEventListener("vendai:start-onboarding", reiniciar);
  }, []);

  useEffect(() => {
    if (!aberto) return undefined;
    const focoAnterior = document.activeElement;
    dialogRef.current?.focus();
    const fecharComEscape = (evento) => {
      if (evento.key === "Escape") {
        if (chave) localStorage.setItem(chave, "true");
        setAberto(false);
        setPasso(0);
      }
    };
    window.addEventListener("keydown", fecharComEscape);
    return () => { window.removeEventListener("keydown", fecharComEscape); focoAnterior?.focus?.(); };
  }, [aberto, chave]);

  const concluir = (explorar = false) => {
    if (chave) localStorage.setItem(chave, "true");
    setAberto(false);
    setPasso(0);
    if (explorar) navigate(atual.destino || "/produtos");
  };

  if (!aberto) return null;

  const atual = passos[passo];
  const ultimo = passo === passos.length - 1;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div ref={dialogRef} tabIndex={-1} className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-indigo-950/20 outline-none">
        <button type="button" onClick={() => concluir()} aria-label="Fechar guia" className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
          <X size={19} />
        </button>

        <div className={`bg-gradient-to-br ${atual.cor} px-6 py-9 text-white sm:px-9`}>
          <span className="grid size-14 place-items-center rounded-2xl bg-white/20 shadow-inner backdrop-blur">
            {createElement(atual.icon, { size: 28 })}
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/75">Passo {passo + 1} de {passos.length}</p>
          <h2 id="onboarding-title" className="mt-2 text-2xl font-extrabold sm:text-3xl">{atual.titulo}</h2>
          <p className="mt-3 max-w-md leading-7 text-white/85">{atual.texto}</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex gap-2" aria-label={`Progresso: ${passo + 1} de ${passos.length}`}>
            {passos.map((item, indice) => (
              <span key={item.titulo} className={`h-1.5 flex-1 rounded-full transition-colors ${indice <= passo ? "bg-indigo-600" : "bg-slate-200"}`} />
            ))}
          </div>
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => concluir()} className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800">Pular guia</button>
            {ultimo ? (
              <button type="button" onClick={() => concluir(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700">
                <Check size={18} /> {atual.acao || "Começar agora"}
              </button>
            ) : (
              <button type="button" onClick={() => setPasso((valor) => valor + 1)} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-indigo-600">
                Continuar <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

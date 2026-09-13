import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BarChart3, Check, Package, PackagePlus, ReceiptText, Tags, Truck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import vendaiLogo from "../assets/vendai-logo.png";

const passosGestao = [
  { icon: BarChart3, titulo: "Conheça o seu painel", texto: "Aqui encontra vendas, valor do stock e alertas importantes da operação.", detalhe: "Use estes indicadores para perceber rapidamente o que precisa da sua atenção.", destino: "/painel", acao: "Abrir painel" },
  { icon: Tags, titulo: "Organize as categorias", texto: "Crie categorias antes de registar os produtos da empresa.", detalhe: "Uma estrutura simples, como Bebidas, Mercearia ou Informática, facilita pesquisas e relatórios.", destino: "/adicionarCategoria", acao: "Criar categoria" },
  { icon: Truck, titulo: "Registe os fornecedores", texto: "Guarde os fornecedores e os respetivos contactos num único lugar.", detalhe: "Depois poderá associar cada produto ao fornecedor correto.", destino: "/adicionarFornecedor", acao: "Registar fornecedor" },
  { icon: PackagePlus, titulo: "Adicione o primeiro produto", texto: "Informe preços, quantidade inicial e o nível mínimo de stock.", detalhe: "O Vendai passa a controlar automaticamente as entradas, saídas e alertas desse produto.", destino: "/adicionarProduto", acao: "Adicionar produto" },
];

const passosOperador = [
  { icon: BarChart3, titulo: "Conheça o seu painel", texto: "Consulte os principais indicadores e os alertas da operação.", detalhe: "O painel ajuda a identificar rapidamente produtos com stock baixo.", destino: "/painel", acao: "Abrir painel" },
  { icon: Package, titulo: "Consulte os produtos", texto: "Pesquise produtos e confirme a quantidade disponível antes de uma operação.", detalhe: "Os dados são atualizados à medida que as vendas e os movimentos são registados.", destino: "/produtos", acao: "Ver produtos" },
  { icon: ReceiptText, titulo: "Registe uma venda", texto: "Adicione produtos, confirme o pagamento e emita o comprovativo.", detalhe: "O stock é descontado automaticamente depois de concluir a venda.", destino: "/vendas/nova", acao: "Iniciar venda" },
];

export default function Onboarding() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const passos = useMemo(() => usuario?.role === "operador" ? passosOperador : passosGestao, [usuario?.role]);
  const [aberto, setAberto] = useState(() => usuario?.id ? localStorage.getItem(`vendai.onboarding.completed.${usuario.id}`) !== "true" : false);
  const [passo, setPasso] = useState(0);
  const dialogRef = useRef(null);
  const chave = usuario?.id ? `vendai.onboarding.completed.${usuario.id}` : null;

  useEffect(() => {
    const reiniciar = () => { setPasso(0); setAberto(true); };
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
        setAberto(false); setPasso(0);
      }
    };
    window.addEventListener("keydown", fecharComEscape);
    return () => { window.removeEventListener("keydown", fecharComEscape); focoAnterior?.focus?.(); };
  }, [aberto, chave]);

  const concluir = (destino) => {
    if (chave) localStorage.setItem(chave, "true");
    setAberto(false); setPasso(0);
    if (destino) navigate(destino);
  };

  if (!aberto) return null;
  const atual = passos[passo];
  const IconeAtual = atual.icon;
  const ultimo = passo === passos.length - 1;

  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
    <div ref={dialogRef} tabIndex={-1} className="relative grid max-h-[92dvh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none md:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden bg-slate-950 p-6 text-white md:flex md:flex-col">
        <img src={vendaiLogo} alt="Vendai" className="h-8 w-auto max-w-28 rounded bg-white object-contain px-2" />
        <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-slate-400">Configuração inicial</p>
        <ol className="mt-4 space-y-2">{passos.map((item, indice) => {
          const Icone = item.icon; const ativo = indice === passo; const concluido = indice < passo;
          return <li key={item.titulo} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${ativo ? "bg-white/10 text-white" : "text-slate-400"}`}><span className={`grid size-7 shrink-0 place-items-center rounded-lg ${ativo || concluido ? "bg-indigo-500 text-white" : "bg-white/5"}`}>{concluido ? <Check size={15}/> : <Icone size={15}/>}</span><span className="line-clamp-2">{item.titulo}</span></li>;
        })}</ol>
        <p className="mt-auto pt-8 text-xs leading-5 text-slate-500">Pode voltar a abrir este guia através da opção “Guia rápido” na navegação.</p>
      </aside>

      <section className="flex min-h-0 flex-col overflow-y-auto">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7"><div><p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Primeiros passos</p><p className="mt-0.5 text-sm text-slate-500">Etapa {passo + 1} de {passos.length}</p></div><button type="button" onClick={() => concluir()} aria-label="Fechar guia" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X size={20}/></button></header>
        <div className="flex-1 px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700"><IconeAtual size={23}/></span><div><h2 id="onboarding-title" className="text-2xl font-bold tracking-tight text-slate-900">{atual.titulo}</h2><p className="mt-2 leading-7 text-slate-600">{atual.texto}</p></div></div>
          <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-700">O que precisa de saber</p><p className="mt-1.5 text-sm leading-6 text-slate-600">{atual.detalhe}</p></div>
          <div className="mt-7 flex gap-1.5 md:hidden" aria-label={`Progresso: ${passo + 1} de ${passos.length}`}>{passos.map((item, indice) => <span key={item.titulo} className={`h-1.5 flex-1 rounded-full ${indice <= passo ? "bg-indigo-600" : "bg-slate-200"}`}/>)}</div>
        </div>
        <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <button type="button" onClick={() => concluir()} className="px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800">Ignorar guia</button>
          <div className="flex gap-2">{passo > 0 && <button type="button" onClick={() => setPasso((valor) => valor - 1)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:flex-none"><ArrowLeft size={17}/>Voltar</button>}{ultimo ? <button type="button" onClick={() => concluir(atual.destino)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 sm:flex-none"><Check size={17}/>{atual.acao}</button> : <button type="button" onClick={() => setPasso((valor) => valor + 1)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:flex-none">Continuar<ArrowRight size={17}/></button>}</div>
        </footer>
      </section>
    </div>
  </div>;
}

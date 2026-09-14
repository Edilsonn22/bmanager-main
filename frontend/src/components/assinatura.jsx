import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, CreditCard, LoaderCircle, ReceiptText, ShieldCheck, Users } from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";

const catalogo = {
  teste: { beneficios: ["14 dias com recursos do Business", "Até 5 utilizadores", "Produtos e vendas ilimitados", "Sem cartão bancário"], nota: "Disponível apenas para novas contas." },
  starter: { beneficios: ["1 utilizador e 1 estabelecimento", "Produtos, clientes e fornecedores ilimitados", "Vendas, stock e caixa", "Dashboard e relatórios essenciais", "Suporte por ticket"], nota: "Ideal para pequenos negócios." },
  business: { beneficios: ["Tudo do Starter", "Até 5 utilizadores", "Perfis e permissões", "Gestão financeira e relatórios avançados", "Exportação Excel, CSV e PDF"], nota: "Mais controlo para equipas em crescimento." },
  enterprise: { beneficios: ["Tudo do Business", "Até 15 utilizadores", "Configuração personalizada", "Formação e implementação assistida", "Gestor de suporte dedicado"], nota: "Acompanhamento personalizado." },
};

const chaveDoPlano = (nome = "") => {
  const valor = nome.toLocaleLowerCase("pt-MZ");
  if (valor.includes("teste")) return "teste";
  if (valor.includes("enterprise")) return "enterprise";
  if (valor.includes("business")) return "business";
  return "starter";
};
const moeda = (valor) => Number(valor || 0).toLocaleString("pt-MZ", { style: "currency", currency: "MZN", maximumFractionDigits: 0 });
const formatarData = (data) => data ? new Date(data).toLocaleDateString("pt-MZ") : "sem data de expiração";
const diasRestantes = (data) => data ? Math.max(0, Math.ceil((new Date(data).getTime() - Date.now()) / 86400000)) : null;
const estados = {
  ativa: ["Ativa", "bg-emerald-100 text-emerald-700"], pendente: ["Pendente", "bg-amber-100 text-amber-700"],
  expirada: ["Expirada", "bg-red-100 text-red-700"], cancelada: ["Cancelada", "bg-slate-200 text-slate-700"],
};

export default function Assinatura() {
  const [proprietario, setProprietario] = useState(false);
  const [planos, setPlanos] = useState([]);
  const [assinatura, setAssinatura] = useState(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(null);
  const [planoPagamento, setPlanoPagamento] = useState(null);
  const [metodo, setMetodo] = useState("mpesa");
  const [telefone, setTelefone] = useState("");
  const [pagamentoPendente, setPagamentoPendente] = useState(null);
  const [gatewayConfigurado, setGatewayConfigurado] = useState(false);

  const carregar = useCallback(async () => {
    const respostas = await Promise.all([fetch(`${API_URL}/planos`), fetch(`${API_URL}/assinaturas/minha`), fetch(`${API_URL}/plataforma/acesso`), fetch(`${API_URL}/pagamentos/configuracao`)]);
    const [respostaPlanos, respostaAssinatura, , respostaGateway] = respostas;
    const [dadosPlanos, dadosAssinatura, dadosAcesso, dadosGateway] = await Promise.all(respostas.map((r) => r.json()));
    const eProprietario = Boolean(dadosAcesso.proprietario);
    if (!respostaPlanos.ok || !respostaGateway.ok || (!respostaAssinatura.ok && !eProprietario)) throw new Error(dadosPlanos.erro || dadosAssinatura.erro || dadosGateway.erro || "Não foi possível carregar os planos.");
    setPlanos(dadosPlanos.planos || []);
    setAssinatura(respostaAssinatura.ok ? dadosAssinatura.assinatura || null : null);
    setProprietario(eProprietario);
    setGatewayConfigurado(Boolean(dadosGateway.gateway?.configurado));
  }, []);

  useEffect(() => { carregar().catch((e) => setErro(e.message)).finally(() => setCarregando(false)); }, [carregar]);

  const iniciarPagamento = async (event) => {
    event.preventDefault(); const planoId = planoPagamento.id;
    setErro(""); setMensagem(""); setProcessando(planoId);
    try {
      const resposta = await fetch(`${API_URL}/pagamentos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planoId, method: metodo, phone: telefone }) });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(`${dados.erro || "Não foi possível iniciar o pagamento."}${import.meta.env.DEV && dados.detalhe_tecnico ? ` (${dados.detalhe_tecnico})` : ""}`);
      if (!dados.pagamento?.id) throw new Error("A Débito não devolveu a referência do pagamento.");
      if (dados.pagamento.checkout_url) return window.location.assign(dados.pagamento.checkout_url);
      setPagamentoPendente(dados.pagamento); setPlanoPagamento(null); setMensagem("Pedido enviado. Confirme o pagamento no seu telemóvel.");
    } catch (e) { setErro(e.message); setProcessando(null); }
  };

  useEffect(() => {
    if (!pagamentoPendente?.id) return undefined;
    let tentativas = 0;
    const consultar = async () => {
      tentativas += 1;
      try {
        const resposta = await fetch(`${API_URL}/pagamentos/${encodeURIComponent(pagamentoPendente.id)}`); const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível consultar o pagamento.");
        if (dados.pagamento?.status === "pago") { setMensagem("Pagamento confirmado. A sua assinatura já está ativa."); setPagamentoPendente(null); setProcessando(null); await carregar(); }
        else if (dados.pagamento?.status === "falhou") { setErro("O pagamento não foi concluído. Pode tentar novamente."); setPagamentoPendente(null); setProcessando(null); }
      } catch (e) { if (tentativas >= 20) { setErro(e.message); setPagamentoPendente(null); setProcessando(null); } }
    };
    consultar();
    const intervalo = window.setInterval(() => { if (tentativas >= 20) { window.clearInterval(intervalo); setMensagem("O pagamento continua pendente. Consulte o histórico dentro de alguns instantes."); setPagamentoPendente(null); setProcessando(null); } else consultar(); }, 5000);
    return () => window.clearInterval(intervalo);
  }, [pagamentoPendente?.id, carregar]);

  const agendarDowngrade = async (planoId) => {
    setErro(""); setMensagem(""); setProcessando(planoId);
    try { const resposta = await fetch(`${API_URL}/assinaturas/downgrade`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planoId }) }); const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Não foi possível agendar o downgrade."); setMensagem(dados.mensagem); await carregar(); }
    catch (e) { setErro(e.message); } finally { setProcessando(null); }
  };

  const alterarCancelamento = async (rota) => {
    setErro(""); setMensagem(""); setProcessando("cancelamento");
    try { const resposta = await fetch(`${API_URL}/assinaturas/${rota}`, { method: "POST" }); const dados = await resposta.json(); if (!resposta.ok) throw new Error(dados.erro || "Não foi possível alterar a renovação."); setMensagem(dados.mensagem); await carregar(); }
    catch (e) { setErro(e.message); } finally { setProcessando(null); }
  };

  const restante = useMemo(() => diasRestantes(assinatura?.expira_em), [assinatura?.expira_em]);
  const estado = estados[assinatura?.status] || estados.pendente;
  if (carregando) return <main className="flex flex-1 items-center justify-center bg-slate-50 p-8"><LoaderCircle className="animate-spin text-indigo-600"/><span className="ml-3 text-slate-600">A carregar planos…</span></main>;

  return <main className="flex-1 overflow-auto bg-slate-50 px-4 py-6 sm:px-6 lg:p-8"><div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-600">Subscrição Vendai</p><h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Plano e assinatura</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Escolha a capacidade certa para o seu negócio. O upgrade é ativado após o pagamento e o downgrade na próxima renovação.</p></div><div className="flex flex-wrap gap-2"><Link to="/historico-pagamentos" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700"><ReceiptText size={17}/>Pagamentos</Link><Link to="/notificacoes" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700">Notificações</Link></div></header>

    {proprietario ? <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 sm:flex sm:items-center sm:justify-between"><div><h3 className="font-bold text-indigo-950">Administração do catálogo</h3><p className="mt-1 text-sm text-indigo-800">A conta do proprietário administra os planos, mas não possui assinatura de empresa.</p></div><div className="mt-4 flex flex-wrap gap-2 sm:mt-0"><Link to="/admin/planos" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Gerir planos</Link><Link to="/admin/sistema" className="rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700">Painel do proprietário</Link></div></section> : assinatura ?
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center lg:p-6"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold text-slate-900">{assinatura.plano_nome}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${estado[1]}`}>{estado[0]}</span></div><p className="mt-2 text-sm text-slate-500">O seu plano atual e respetivo período de acesso.</p></div><Info icon={CalendarDays} titulo="Fim do período" valor={formatarData(assinatura.expira_em)}/><Info icon={Clock3} titulo="Tempo restante" valor={restante === null ? "Sem expiração" : `${restante} ${restante === 1 ? "dia" : "dias"}`}/><div>{assinatura.cancelamento_agendado_em ? <button disabled={processando !== null} onClick={() => alterarCancelamento("reativar")} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Reativar renovação</button> : <button disabled={processando !== null || assinatura.status !== "ativa"} onClick={() => alterarCancelamento("cancelar")} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Cancelar renovação</button>}</div></div>{(assinatura.plano_pendente_nome || assinatura.cancelamento_agendado_em) && <div className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">{assinatura.plano_pendente_nome ? <>Na próxima renovação será aplicado o plano <strong>{assinatura.plano_pendente_nome}</strong>.</> : <>A renovação está cancelada. O acesso permanece ativo até <strong>{formatarData(assinatura.cancelamento_agendado_em)}</strong>.</>}</div>}</section> :
      <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Esta empresa ainda não possui uma assinatura. Escolha um dos planos pagos abaixo.</p>}

    {mensagem && <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{mensagem}</p>}{erro && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{erro}</p>}{!gatewayConfigurado && !proprietario && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Os pagamentos online estão temporariamente indisponíveis. Pode consultar os planos enquanto concluímos a configuração.</p>}

    <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{planos.map((plano) => {
      const chave = chaveDoPlano(plano.nome); const info = catalogo[chave]; const atual = assinatura?.plano_id === plano.id; const gratuito = Number(plano.valor) === 0;
      const downgrade = assinatura && !gratuito && Number(plano.valor) < Number(assinatura.valor); const pendente = assinatura?.plano_pendente_id === plano.id; const destaque = chave === "business";
      let texto = atual ? "Plano atual" : pendente ? "Downgrade agendado" : downgrade ? "Agendar downgrade" : "Escolher plano"; if (gratuito && !atual) texto = "Apenas para novas contas";
      const desativado = proprietario || atual || pendente || gratuito || processando !== null || (!downgrade && !gatewayConfigurado);
      return <article key={plano.id} className={`relative flex min-w-0 flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${destaque ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200"}`}>{destaque && <span className="absolute -top-3 left-5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">Mais escolhido</span>}<div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-bold text-slate-900">{plano.nome}</h3><p className="mt-1 text-xs font-semibold text-indigo-600">{info.nota}</p></div>{atual && <CheckCircle2 className="shrink-0 text-emerald-500" size={22}/>}</div><p className="mt-4 min-h-12 text-sm leading-5 text-slate-600">{plano.descricao}</p><div className="mt-5"><span className="text-3xl font-black text-slate-950">{moeda(plano.valor)}</span><span className="text-sm text-slate-500">{gratuito ? " / 14 dias" : " / mês"}</span></div><div className="mt-4 flex gap-4 border-y border-slate-100 py-3 text-xs text-slate-600"><span className="flex items-center gap-1.5"><Users size={15}/>{plano.limite_usuarios} utilizador{Number(plano.limite_usuarios) === 1 ? "" : "es"}</span><span className="flex items-center gap-1.5"><ShieldCheck size={15}/>Dados isolados</span></div><ul className="mt-5 flex-1 space-y-3 text-sm text-slate-600">{info.beneficios.map((item) => <li key={item} className="flex gap-2"><Check size={17} className="mt-0.5 shrink-0 text-emerald-500"/><span>{item}</span></li>)}</ul><button disabled={desativado} onClick={() => downgrade ? agendarDowngrade(plano.id) : setPlanoPagamento(plano)} className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-55 ${destaque ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-900 text-white hover:bg-slate-800"}`}>{processando === plano.id ? <><LoaderCircle size={17} className="animate-spin"/>A processar…</> : <>{texto}{!desativado && <ArrowRight size={17}/>}</>}</button></article>;
    })}</div>
  </div>

  {planoPagamento && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-pagamento"><form onSubmit={iniciarPagamento} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="grid size-11 place-items-center rounded-xl bg-indigo-100 text-indigo-700"><CreditCard size={21}/></span><div><h3 id="titulo-pagamento" className="text-xl font-bold text-slate-900">Confirmar assinatura</h3><p className="mt-1 text-sm text-slate-600">{planoPagamento.nome} · {moeda(planoPagamento.valor)}/mês</p></div></div><button type="button" onClick={() => setPlanoPagamento(null)} className="rounded-lg px-2 py-1 text-xl text-slate-500" aria-label="Fechar">×</button></div><fieldset className="mt-6"><legend className="text-sm font-semibold text-slate-700">Método de pagamento</legend><div className="mt-2 grid grid-cols-2 gap-3">{[["mpesa", "M-Pesa"], ["emola", "eMola"]].map(([valor, nome]) => <label key={valor} className={`cursor-pointer rounded-xl border p-3 text-center font-semibold ${metodo === valor ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200"}`}><input type="radio" name="metodo" value={valor} checked={metodo === valor} onChange={(e) => setMetodo(e.target.value)} className="sr-only"/>{nome}</label>)}</div></fieldset><label className="mt-5 block text-sm font-semibold text-slate-700">Número de telefone<input required inputMode="tel" autoComplete="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Ex.: 851234567" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"/></label><p className="mt-3 text-xs leading-5 text-slate-500">Receberá uma solicitação no telemóvel para confirmar com o seu PIN. O Vendai nunca solicita nem guarda o PIN.</p><button disabled={processando !== null} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{processando ? <><LoaderCircle size={17} className="animate-spin"/>A enviar…</> : "Enviar pedido de pagamento"}</button></form></div>}
  </main>;
}

function Info({ icon, titulo, valor }) { return <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">{createElement(icon, { size: 19 })}</span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p><p className="mt-0.5 text-sm font-bold text-slate-800">{valor}</p></div></div>; }

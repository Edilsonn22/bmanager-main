import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Eye, Inbox, LogOut, X, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL as API } from "../api/authenticatedFetch";
import { useAuth } from "../features/auth/AuthContext";
import vendaiLogo from "../assets/vendai-logo.png";

const nomeEstado = { aberto: "Recebida", em_andamento: "Em análise", resolvido: "Resolvida", fechado: "Encerrada" };
const corEstado = { aberto: "bg-blue-100 text-blue-700", em_andamento: "bg-amber-100 text-amber-700", resolvido: "bg-emerald-100 text-emerald-700", fechado: "bg-slate-100 text-slate-600" };

export default function Plataforma() {
  const { terminarSessao } = useAuth();
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [selecionada, setSelecionada] = useState(null);
  const [erro, setErro] = useState("");
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/plataforma/resumo`).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.erro); return d; }),
      fetch(`${API}/suporte/admin/tickets`).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.erro); return d.tickets || []; }),
    ]).then(([resumo, tickets]) => { setDados(resumo); setSolicitacoes(tickets); }).catch((e) => setErro(e.message));
  }, []);

  const alterarEstado = async (ticket, estado) => {
    setAtualizando(true); setErro("");
    try {
      const resposta = await fetch(`${API}/suporte/admin/tickets/${ticket.id}/estado`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado }) });
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível atualizar a solicitação.");
      const atualizada = { ...ticket, ...resultado.ticket };
      setSolicitacoes((lista) => lista.map((item) => item.id === ticket.id ? atualizada : item));
      setSelecionada(atualizada);
    } catch (error) { setErro(error.message); } finally { setAtualizando(false); }
  };

  const abrir = async (ticket) => { setSelecionada(ticket); if (ticket.estado === "aberto") await alterarEstado(ticket, "em_andamento"); };
  if (erro && !dados) return <main className="flex-1 p-7 text-red-700">{erro}</main>;
  if (!dados) return <main className="flex-1 p-7">A carregar painel da plataforma…</main>;
  const ativos = dados.resumo.assinaturas.find((item) => item.estado === "ativa")?.total || 0;
  const pendentes = solicitacoes.filter((item) => ["aberto", "em_andamento"].includes(item.estado)).length;

  return <main className="flex-1 overflow-auto bg-slate-50 p-5 md:p-7">
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><img src={vendaiLogo} alt="Vendai" className="h-10 w-auto max-w-36 rounded-lg bg-white object-contain"/><div><h1 className="text-2xl font-bold text-slate-900">Painel do proprietário</h1><p className="mt-1 text-slate-600">Visão global da Vendai e atendimento aos clientes.</p></div></div><button type="button" onClick={() => { terminarSessao(); navigate("/login", { replace: true }); }} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-100"><LogOut size={17} />Terminar sessão</button></header>
    {erro && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{erro}</p>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Empresas", dados.resumo.empresas], ["Utilizadores", dados.resumo.usuarios], ["Assinaturas ativas", ativos], ["Solicitações pendentes", pendentes]].map(([nome, valor]) => <section key={nome} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{nome}</p><p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p></section>)}</div>

    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-semibold text-slate-900">Solicitações de suporte</h2><p className="text-sm text-slate-500">Abrir uma solicitação altera o estado para “Em análise”.</p></div><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Inbox size={20} /></span></div>
      {solicitacoes.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr><th>Empresa</th><th>Assunto</th><th>Enviada por</th><th>Estado</th><th>Data</th><th className="text-right">Ação</th></tr></thead><tbody>{solicitacoes.map((ticket) => <tr key={ticket.id}><td>{ticket.empresa}</td><td>{ticket.assunto}</td><td><span className="block">{ticket.utilizador}</span><small className="text-slate-400">{ticket.email}</small></td><td><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${corEstado[ticket.estado]}`}>{ticket.estado === "resolvido" && <CheckCircle2 size={14} />}{nomeEstado[ticket.estado]}</span></td><td>{new Date(ticket.created_at).toLocaleDateString("pt-MZ")}</td><td className="text-right"><button type="button" onClick={() => abrir(ticket)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-indigo-600 hover:bg-indigo-50"><Eye size={16} />Abrir</button></td></tr>)}</tbody></table></div> : <p className="p-8 text-center text-slate-500">Nenhuma solicitação recebida.</p>}
    </section>

    <section className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Pagamentos recentes</h2><table className="mt-4 w-full text-left text-sm"><thead><tr><th>Empresa</th><th>Referência</th><th>Valor</th><th>Estado</th></tr></thead><tbody>{dados.pagamentos_recentes.map((pagamento) => <tr key={pagamento.referencia}><td>{pagamento.empresa}</td><td>{pagamento.referencia}</td><td>{pagamento.valor} {pagamento.moeda}</td><td>{pagamento.estado}</td></tr>)}</tbody></table></section>

    {selecionada && <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="solicitacao-titulo"><article className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-600">{selecionada.empresa}</p><h2 id="solicitacao-titulo" className="mt-1 text-xl font-bold text-slate-900">{selecionada.assunto}</h2><p className="mt-1 text-sm text-slate-500">Enviada por {selecionada.utilizador} · {new Date(selecionada.created_at).toLocaleDateString("pt-MZ")}</p></div><button type="button" onClick={() => setSelecionada(null)} aria-label="Fechar" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
      <p className="mt-6 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 leading-7 text-slate-700">{selecionada.mensagem}</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${corEstado[selecionada.estado]}`}>{selecionada.estado === "em_andamento" && <Clock3 size={16} />}{selecionada.estado === "resolvido" && <CheckCircle2 size={16} />}{nomeEstado[selecionada.estado]}</span><div className="flex flex-wrap gap-2">{selecionada.estado !== "resolvido" && <button type="button" disabled={atualizando} onClick={() => alterarEstado(selecionada, "resolvido")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><CheckCircle2 size={17} />Marcar resolvida</button>}{selecionada.estado !== "fechado" && <button type="button" disabled={atualizando} onClick={() => alterarEstado(selecionada, "fechado")} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"><XCircle size={17} />Encerrar</button>}</div></div>
    </article></div>}
  </main>;
}

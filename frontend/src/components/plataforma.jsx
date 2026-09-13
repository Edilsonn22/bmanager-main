import { useEffect, useState } from "react";
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, Inbox, LogOut, Mail, Phone, Search, Users, X, XCircle } from "lucide-react";
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
  const [empresas, setEmpresas] = useState([]);
  const [utilizadores, setUtilizadores] = useState([]);
  const [paginacao, setPaginacao] = useState({ pagina: 1, total: 0, total_paginas: 1 });
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState(null);
  const [erro, setErro] = useState("");
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/plataforma/resumo`).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.erro); return d; }),
      fetch(`${API}/suporte/admin/tickets`).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.erro); return d.tickets || []; }),
      fetch(`${API}/plataforma/utilizadores?limite=20`).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.erro); return d; }),
      fetch(`${API}/plataforma/empresas`).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.erro); return d.empresas || []; }),
    ]).then(([resumo, tickets, pessoas, listaEmpresas]) => { setDados(resumo); setSolicitacoes(tickets); setUtilizadores(pessoas.utilizadores || []); setPaginacao(pessoas.paginacao); setEmpresas(listaEmpresas); }).catch((e) => setErro(e.message));
  }, []);

  const carregarUtilizadores = async (pagina = 1, termo = busca) => {
    try {
      setErro("");
      const parametros = new URLSearchParams({ pagina: String(pagina), limite: "20" });
      if (termo.trim()) parametros.set("busca", termo.trim());
      const resposta = await fetch(`${API}/plataforma/utilizadores?${parametros}`);
      const resultado = await resposta.json();
      if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível carregar os utilizadores.");
      setUtilizadores(resultado.utilizadores || []);
      setPaginacao(resultado.paginacao);
    } catch (error) { setErro(error.message); }
  };

  const pesquisarUtilizadores = (evento) => {
    evento.preventDefault();
    carregarUtilizadores(1);
  };

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

    <nav aria-label="Secções do painel" className="mt-5 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {[["empresas", "Empresas"], ["suporte", "Suporte"], ["pessoas", "Pessoas"], ["pagamentos", "Pagamentos"]].map(([id, nome]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">{nome}</a>)}
    </nav>

    <section id="empresas" className="mt-6 scroll-mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-semibold text-slate-900">Empresas registadas</h2><p className="text-sm text-slate-500">Contactos, plano e dimensão de cada conta.</p></div><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Building2 size={20}/></span></div>
      {empresas.length ? <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr><th>Empresa</th><th>Contacto</th><th>Plano</th><th>Utilização</th><th>Estado</th><th>Registo</th></tr></thead><tbody>{empresas.map((empresa) => <tr key={empresa.id}><td><span className="block font-semibold text-slate-800">{empresa.nome}</span><small className="text-slate-500">{empresa.nuit ? `NUIT: ${empresa.nuit}` : "NUIT não informado"}</small></td><td><span className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/>{empresa.telefone || "Não informado"}</span><small className="mt-1 flex items-center gap-1.5 text-slate-500"><Mail size={14}/>{empresa.email || "Sem e-mail"}</small></td><td><span className="block">{empresa.plano || "Sem plano"}</span><small className="capitalize text-slate-500">{empresa.assinatura_estado || "Sem assinatura"}</small></td><td><span className="block">{empresa.usuarios} utilizador(es)</span><small className="text-slate-500">{empresa.produtos} produto(s)</small></td><td><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${empresa.bloqueada ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{empresa.bloqueada ? "Bloqueada" : "Ativa"}</span></td><td>{new Date(empresa.created_at).toLocaleDateString("pt-MZ")}</td></tr>)}</tbody></table></div>
        <div className="grid gap-3 p-4 md:hidden">{empresas.map((empresa) => <article key={empresa.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{empresa.nome}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><Phone size={14}/>{empresa.telefone || "Contacto não informado"}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${empresa.bloqueada ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{empresa.bloqueada ? "Bloqueada" : "Ativa"}</span></div><p className="mt-2 flex items-center gap-1.5 break-all text-sm text-slate-500"><Mail size={14}/>{empresa.email || "Sem e-mail"}</p><dl className="mt-4 grid grid-cols-3 gap-2 text-sm"><div><dt className="text-slate-400">Plano</dt><dd className="font-medium">{empresa.plano || "—"}</dd></div><div><dt className="text-slate-400">Pessoas</dt><dd className="font-medium">{empresa.usuarios}</dd></div><div><dt className="text-slate-400">Produtos</dt><dd className="font-medium">{empresa.produtos}</dd></div></dl></article>)}</div>
      </> : <p className="p-8 text-center text-slate-500">Nenhuma empresa registada.</p>}
    </section>

    <section id="suporte" className="mt-6 scroll-mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="font-semibold text-slate-900">Solicitações de suporte</h2><p className="text-sm text-slate-500">Abrir uma solicitação altera o estado para “Em análise”.</p></div><span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Inbox size={20} /></span></div>
      {solicitacoes.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr><th>Empresa</th><th>Assunto</th><th>Enviada por</th><th>Estado</th><th>Data</th><th className="text-right">Ação</th></tr></thead><tbody>{solicitacoes.map((ticket) => <tr key={ticket.id}><td>{ticket.empresa}</td><td>{ticket.assunto}</td><td><span className="block">{ticket.utilizador}</span><small className="text-slate-400">{ticket.email}</small></td><td><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${corEstado[ticket.estado]}`}>{ticket.estado === "resolvido" && <CheckCircle2 size={14} />}{nomeEstado[ticket.estado]}</span></td><td>{new Date(ticket.created_at).toLocaleDateString("pt-MZ")}</td><td className="text-right"><button type="button" onClick={() => abrir(ticket)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-indigo-600 hover:bg-indigo-50"><Eye size={16} />Abrir</button></td></tr>)}</tbody></table></div> : <p className="p-8 text-center text-slate-500">Nenhuma solicitação recebida.</p>}
    </section>

    <section id="pessoas" className="mt-6 scroll-mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Users size={20} /></span><div><h2 className="font-semibold text-slate-900">Pessoas registadas</h2><p className="text-sm text-slate-500">{paginacao.total} utilizador{paginacao.total === 1 ? "" : "es"} no sistema.</p></div></div>
        <form onSubmit={pesquisarUtilizadores} className="flex w-full gap-2 lg:max-w-md"><label className="relative flex-1"><span className="sr-only">Pesquisar pessoas</span><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, e-mail ou empresa" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"/></label><button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Pesquisar</button></form>
      </div>
      {utilizadores.length ? <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr><th>Pessoa</th><th>Empresa</th><th>Perfil</th><th>Plano</th><th>Contacto da empresa</th><th>Registo</th></tr></thead><tbody>{utilizadores.map((pessoa) => <tr key={pessoa.id}><td><span className="block font-semibold text-slate-800">{pessoa.nome}</span><small className="text-slate-500">{pessoa.email}</small></td><td><span className="block">{pessoa.empresa}</span>{Boolean(pessoa.bloqueada) && <small className="font-semibold text-red-600">Bloqueada</small>}</td><td className="capitalize">{pessoa.role}</td><td><span className="block">{pessoa.plano || "Sem plano"}</span><small className="capitalize text-slate-500">{pessoa.assinatura_estado || "Sem assinatura"}</small></td><td><span className="block">{pessoa.empresa_telefone || "—"}</span><small className="text-slate-500">{pessoa.empresa_email || ""}</small></td><td>{new Date(pessoa.created_at).toLocaleDateString("pt-MZ")}</td></tr>)}</tbody></table></div>
        <div className="grid gap-3 p-4 md:hidden">{utilizadores.map((pessoa) => <article key={pessoa.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{pessoa.nome}</h3><p className="break-all text-sm text-slate-500">{pessoa.email}</p></div><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-700">{pessoa.role}</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-400">Empresa</dt><dd className="font-medium text-slate-700">{pessoa.empresa}</dd></div><div><dt className="text-slate-400">Plano</dt><dd className="font-medium text-slate-700">{pessoa.plano || "Sem plano"}</dd></div><div><dt className="text-slate-400">Contacto</dt><dd className="font-medium text-slate-700">{pessoa.empresa_telefone || "—"}</dd></div><div><dt className="text-slate-400">Registo</dt><dd className="font-medium text-slate-700">{new Date(pessoa.created_at).toLocaleDateString("pt-MZ")}</dd></div></dl></article>)}</div>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4"><p className="text-sm text-slate-500">Página {paginacao.pagina} de {paginacao.total_paginas}</p><div className="flex gap-2"><button type="button" aria-label="Página anterior" disabled={paginacao.pagina <= 1} onClick={() => carregarUtilizadores(paginacao.pagina - 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={18}/></button><button type="button" aria-label="Página seguinte" disabled={paginacao.pagina >= paginacao.total_paginas} onClick={() => carregarUtilizadores(paginacao.pagina + 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={18}/></button></div></div>
      </> : <p className="p-8 text-center text-slate-500">Nenhuma pessoa encontrada.</p>}
    </section>

    <section id="pagamentos" className="mt-6 scroll-mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Pagamentos recentes</h2><table className="mt-4 w-full text-left text-sm"><thead><tr><th>Empresa</th><th>Referência</th><th>Valor</th><th>Estado</th></tr></thead><tbody>{dados.pagamentos_recentes.map((pagamento) => <tr key={pagamento.referencia}><td>{pagamento.empresa}</td><td>{pagamento.referencia}</td><td>{pagamento.valor} {pagamento.moeda}</td><td>{pagamento.estado}</td></tr>)}</tbody></table></section>

    {selecionada && <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="solicitacao-titulo"><article className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-600">{selecionada.empresa}</p><h2 id="solicitacao-titulo" className="mt-1 text-xl font-bold text-slate-900">{selecionada.assunto}</h2><p className="mt-1 text-sm text-slate-500">Enviada por {selecionada.utilizador} · {new Date(selecionada.created_at).toLocaleDateString("pt-MZ")}</p></div><button type="button" onClick={() => setSelecionada(null)} aria-label="Fechar" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
      <p className="mt-6 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 leading-7 text-slate-700">{selecionada.mensagem}</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${corEstado[selecionada.estado]}`}>{selecionada.estado === "em_andamento" && <Clock3 size={16} />}{selecionada.estado === "resolvido" && <CheckCircle2 size={16} />}{nomeEstado[selecionada.estado]}</span><div className="flex flex-wrap gap-2">{selecionada.estado !== "resolvido" && <button type="button" disabled={atualizando} onClick={() => alterarEstado(selecionada, "resolvido")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><CheckCircle2 size={17} />Marcar resolvida</button>}{selecionada.estado !== "fechado" && <button type="button" disabled={atualizando} onClick={() => alterarEstado(selecionada, "fechado")} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60"><XCircle size={17} />Encerrar</button>}</div></div>
    </article></div>}
  </main>;
}

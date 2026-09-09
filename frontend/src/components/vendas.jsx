import { createElement, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  ChevronRight,
  CircleX,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
} from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";
import { Feedback } from "./ui/Feedback";

const dinheiro = (v) =>
  `${Number(v || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN`;
const badge = (estado) =>
  estado === "cancelada"
    ? "bg-red-50 text-red-700 ring-red-600/10"
    : estado.includes("devolvida")
      ? "bg-amber-50 text-amber-700 ring-amber-600/10"
      : "bg-emerald-50 text-emerald-700 ring-emerald-600/10";
const estadoLabel = (estado) =>
  ({
    concluida: "Concluída",
    cancelada: "Cancelada",
    parcialmente_devolvida: "Devolução parcial",
    devolvida: "Devolvida",
  })[estado] || estado?.replaceAll("_", " ");
const pagamentoLabel = (forma) =>
  ({
    dinheiro: "Dinheiro",
    cartao: "Cartão",
    transferencia: "Transferência",
    credito: "Crédito",
    mpesa: "M-Pesa",
    emola: "e-Mola",
  })[forma] || forma;

export default function Vendas() {
  const [vendas, setVendas] = useState([]);
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API_URL}/vendas`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.erro);
        setVendas(d.vendas || []);
      })
      .catch((e) =>
        setErro(e.message || "Não foi possível carregar as vendas."),
      )
      .finally(() => setLoading(false));
  }, []);
  const lista = useMemo(
    () =>
      vendas.filter(
        (v) =>
          (!estado || v.estado === estado) &&
          `${v.numero} ${v.cliente || ""} ${v.operador}`
            .toLowerCase()
            .includes(busca.toLowerCase()),
      ),
    [vendas, busca, estado],
  );
  const validas = vendas.filter((v) => v.estado !== "cancelada");
  const total = validas.reduce((s, v) => s + Number(v.total), 0);
  return (
    <main className="commerce-page h-dvh min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
      <header className="commerce-header mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">
            Vendas
          </p>
          <h1>Histórico de vendas</h1>
          <p className="text-slate-600">
            Consulte recibos, pagamentos e estados das operações.
          </p>
        </div>
        <Link
          to="/vendas/nova"
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl sm:w-auto"
        >
          <Plus size={19} />
          Nova venda
        </Link>
      </header>
      <Feedback tipo="erro" className="mb-4">
        {erro}
      </Feedback>
      <section
        className="mb-6 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(260px,1.25fr)]"
        aria-label="Resumo das vendas"
      >
        <Resumo
          icon={ReceiptText}
          label="Vendas registadas"
          value={vendas.length}
          apoio="Todas as operações"
        />
        <Resumo
          icon={ShoppingBag}
          label="Vendas válidas"
          value={validas.length}
          apoio="Sem vendas canceladas"
        />
        <Resumo
          icon={Banknote}
          label="Total vendido"
          value={dinheiro(total)}
          apoio="Receita das vendas válidas"
          destaque
        />
      </section>
      <section className="commerce-panel min-w-0 overflow-hidden">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={19}
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar número, cliente ou operador..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar pesquisa"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <CircleX size={18} />
                </button>
              )}
            </div>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              aria-label="Filtrar pelo estado"
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 lg:w-56"
            >
              <option value="">Todos os estados</option>
              <option value="concluida">Concluídas</option>
              <option value="cancelada">Canceladas</option>
              <option value="parcialmente_devolvida">
                Com devolução parcial
              </option>
              <option value="devolvida">Devolvidas</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              <strong className="text-slate-700">{lista.length}</strong>{" "}
              {lista.length === 1 ? "venda encontrada" : "vendas encontradas"}
            </span>
            {(busca || estado) && (
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setEstado("");
                }}
                className="font-bold text-indigo-600 hover:text-indigo-800"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
        <div className="hidden max-w-full overflow-x-hidden lg:block">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                <th className="w-[11%] text-center">Venda</th>
                <th className="w-[15%] text-center">Data</th>
                <th className="w-[18%] text-center">Cliente</th>
                <th className="w-[14%] text-center">Operador</th>
                <th className="w-[14%] text-center">Pagamento</th>
                <th className="w-[15%] text-center">Total</th>
                <th className="w-[13%] text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((v) => (
                <tr key={v.id} className="group">
                  <td className="min-w-0  text-center">
                    <Link
                      to={`/vendas/${v.id}`}
                      className="font-extrabold text-indigo-600 hover:text-indigo-800"
                    >
                      #{String(v.numero).padStart(6, "0")}
                    </Link>
                  </td>
                  <td className="min-w-0 break-words text-center text-sm text-slate-600">
                    {new Date(v.created_at).toLocaleString("pt-MZ", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="min-w-0 break-words text-center">
                    <span className="block break-words font-semibold text-slate-800">
                      {v.cliente || "Consumidor final"}
                    </span>
                  </td>
                  <td className="min-w-0 break-words text-center text-sm text-slate-600">
                    {v.operador}
                  </td>
                  <td className="min-w-0 break-words text-center">
                    <span className="inline-flex max-w-full break-words rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-700">
                      {pagamentoLabel(v.forma_pagamento)}
                    </span>
                  </td>
                  <td className="min-w-0 break-words text-center font-extrabold text-slate-900">
                    {dinheiro(v.total)}
                  </td>
                  <td className="min-w-0 break-words text-center">
                    <span
                      className={`inline-flex max-w-full justify-center break-words rounded-full px-2 py-1 text-xs font-bold ring-1 ring-inset ${badge(v.estado)}`}
                    >
                      {estadoLabel(v.estado)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 bg-slate-50/60 p-3 lg:hidden sm:grid-cols-2">
          {lista.map((v) => (
            <Link
              key={v.id}
              to={`/vendas/${v.id}`}
              className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Venda
                  </span>
                  <strong className="mt-0.5 block text-indigo-700">
                    #{String(v.numero).padStart(6, "0")}
                  </strong>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${badge(v.estado)}`}
                >
                  {estadoLabel(v.estado)}
                </span>
              </div>
              <div className="my-4 border-y border-slate-100 py-3">
                <p className="break-words font-bold text-slate-800">
                  {v.cliente || "Consumidor final"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(v.created_at).toLocaleString("pt-MZ", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="flex min-w-0 items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    {pagamentoLabel(v.forma_pagamento)} · {v.operador}
                  </p>
                  <b className="mt-1 block break-words text-lg text-slate-900">
                    {dinheiro(v.total)}
                  </b>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-400 transition group-hover:bg-indigo-50 group-hover:text-indigo-600">
                  <ChevronRight size={19} />
                </span>
              </div>
            </Link>
          ))}
        </div>
        {loading && (
          <p className="p-10 text-center text-slate-500" role="status">
            A carregar vendas...
          </p>
        )}
        {!loading && !lista.length && (
          <div className="p-12 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500">
              <ReceiptText />
            </span>
            <p className="mt-4 font-bold text-slate-800">
              {busca || estado
                ? "Nenhuma venda corresponde aos filtros."
                : "Ainda não existem vendas."}
            </p>
            {!busca && !estado && (
              <Link
                to="/vendas/nova"
                className="mt-2 inline-block font-semibold text-indigo-600"
              >
                Registar a primeira venda
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
function Resumo({ icon, label, value, apoio, destaque = false }) {
  return (
    <article
      className={`group relative min-w-0 overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${destaque ? "border-indigo-500 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-indigo-200/70 sm:col-span-2 xl:col-span-1" : "border-slate-200 bg-white text-slate-900"}`}
    >
      {destaque && (
        <span
          className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-white/10"
          aria-hidden="true"
        />
      )}
      <div className="relative flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-bold uppercase tracking-[0.12em] ${destaque ? "text-indigo-100" : "text-slate-500"}`}
          >
            {label}
          </p>
          <strong className="mt-2 block min-w-0 break-words text-2xl font-extrabold leading-tight sm:text-[1.65rem]">
            {value}
          </strong>
          <p
            className={`mt-2 text-xs ${destaque ? "text-indigo-100" : "text-slate-500"}`}
          >
            {apoio}
          </p>
        </div>
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset transition-transform duration-200 group-hover:scale-105 ${destaque ? "bg-white/15 text-white ring-white/20" : "bg-indigo-50 text-indigo-600 ring-indigo-100"}`}
        >
          {createElement(icon, { size: 21, "aria-hidden": true })}
        </span>
      </div>
    </article>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Package,
  Plus,
  Printer,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";
import { useAuth } from "../features/auth/AuthContext";
import { ConfirmDialog, Feedback } from "./ui/Feedback";

const dinheiro = (v) =>
  `${Number(v || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN`;
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

export default function DetalheVenda() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { usuario } = useAuth();
  const podeEstornar = ["admin", "gestor"].includes(usuario?.role);
  const [venda, setVenda] = useState(null);
  const [erro, setErro] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [ocupada, setOcupada] = useState(false);
  const [devolucao, setDevolucao] = useState(null);
  const [formatoImpressao, setFormatoImpressao] = useState("a4");
  const carregar = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/vendas/${id}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      setVenda(d.venda);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar a venda.");
    }
  }, [id]);
  useEffect(() => {
    carregar();
  }, [carregar]);
  const postar = async (url, body) => {
    setOcupada(true);
    setErro("");
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      setConfirmar(false);
      setDevolucao(null);
      await carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupada(false);
    }
  };
  if (!venda)
    return (
      <main className="grid h-dvh flex-1 place-items-center bg-slate-50 p-4">
        <Feedback tipo="erro">{erro}</Feedback>
        {!erro && (
          <div className="text-center" role="status">
            <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            <p className="mt-3 text-sm text-slate-500">A carregar venda...</p>
          </div>
        )}
      </main>
    );
  return (
    <main className="h-dvh min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-7">
      <div className="mx-auto w-full max-w-5xl">
        {params.get("concluida") && (
          <Feedback tipo="sucesso" className="mb-4">
            Venda concluída com sucesso.
          </Feedback>
        )}
        <Feedback tipo="erro" className="mb-4">
          {erro}
        </Feedback>
        <div className="mb-4 flex min-w-0 flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/vendas"
            className="inline-flex items-center gap-2 self-start text-sm font-semibold text-slate-600 transition hover:text-indigo-700"
          >
            <ArrowLeft size={17} />
            Voltar ao histórico
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/vendas/nova"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Plus size={17} />
              Nova venda
            </Link>
            <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <select
                value={formatoImpressao}
                onChange={(e) => setFormatoImpressao(e.target.value)}
                aria-label="Formato de impressão"
                className="min-w-0 border-0 bg-white px-3 text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="a4">A4 / PDF</option>
                <option value="thermal">Térmico 80 mm</option>
              </select>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex shrink-0 items-center justify-center gap-2 border-l border-slate-200 px-4 py-2.5 font-bold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Printer size={17} />
                Imprimir
              </button>
            </div>
          </div>
        </div>
        <section
          className={`receipt-print receipt-print--${formatoImpressao} min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm`}
        >
          <header className="receipt-header relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-white via-white to-indigo-50/70 p-5 sm:p-7">
            <span
              className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-indigo-100/50 print:hidden"
              aria-hidden="true"
            />
            <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="receipt-company-block">
                  <p className="receipt-company break-words text-lg font-extrabold text-slate-950">
                    {venda.empresa_nome || "VENDAI"}
                  </p>
                  <div className="receipt-company-details mt-1 space-y-0.5 text-xs text-slate-500">
                    {venda.empresa_nuit && <p>NUIT: {venda.empresa_nuit}</p>}
                    {venda.empresa_endereco && <p>{venda.empresa_endereco}</p>}
                    {(venda.empresa_telefone || venda.empresa_email) && (
                      <p>
                        {[venda.empresa_telefone, venda.empresa_email]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-xs font-extrabold uppercase tracking-[.2em] text-indigo-600">
                  Comprovativo de venda
                </p>
                <h1 className="mt-2 break-words text-2xl font-extrabold text-slate-950 sm:text-3xl">
                  Venda #{String(venda.numero).padStart(6, "0")}
                </h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays size={16} />
                  {new Date(venda.created_at).toLocaleString("pt-MZ", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <span
                className={`receipt-status inline-flex self-start rounded-full px-3 py-1.5 text-sm font-bold ring-1 ring-inset ${venda.estado === "cancelada" ? "bg-red-50 text-red-700 ring-red-200" : venda.estado.includes("devolvida") ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}
              >
                {estadoLabel(venda.estado)}
              </span>
            </div>
          </header>
          <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
            <Info
              icon={UserRound}
              label="Cliente"
              value={venda.cliente || "Consumidor final"}
            />
            <Info
              icon={CreditCard}
              label="Pagamento"
              value={pagamentoLabel(venda.forma_pagamento)}
            />
            <Info icon={UserRound} label="Operador" value={venda.operador} />
            {venda.cliente_nuit && (
              <Info label="NUIT" value={venda.cliente_nuit} />
            )}
          </div>
          <div className="p-4 sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Itens da venda</h2>
                <p className="text-xs text-slate-500">
                  {venda.itens.length}{" "}
                  {venda.itens.length === 1
                    ? "produto registado"
                    : "produtos registados"}
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Package size={19} />
              </span>
            </div>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
              <table className="w-full table-fixed">
                <thead>
                  <tr>
                    <th className="w-[32%]">Produto</th>
                    <th className="w-[12%] text-center">Qtd.</th>
                    <th className="w-[20%] text-right">Preço</th>
                    <th className="w-[20%] text-right">Total</th>
                    {podeEstornar && (
                      <th className="w-[16%] text-center print:hidden">Ação</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {venda.itens.map((item) => {
                    const restante =
                      Number(item.quantidade) -
                      Number(item.quantidade_devolvida);
                    return (
                      <tr key={item.id}>
                        <td className="break-words font-semibold text-slate-800">
                          {item.nome_produto}
                        </td>
                        <td className="text-center">
                          {item.quantidade}
                          {Number(item.quantidade_devolvida) > 0 && (
                            <small className="block break-words text-amber-600">
                              {item.quantidade_devolvida} devolvida(s)
                            </small>
                          )}
                        </td>
                        <td className="break-words text-right">
                          {dinheiro(item.preco_unitario)}
                        </td>
                        <td className="break-words text-right font-bold">
                          {dinheiro(item.total)}
                        </td>
                        {podeEstornar && (
                          <td className="text-center print:hidden">
                            <button
                              type="button"
                              disabled={
                                !restante || venda.estado === "cancelada"
                              }
                              onClick={() =>
                                setDevolucao({ item, quantidade: 1 })
                              }
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:text-slate-300 disabled:hover:bg-transparent"
                            >
                              <RotateCcw size={15} />
                              Devolver
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {venda.itens.map((item) => {
                const restante =
                  Number(item.quantidade) - Number(item.quantidade_devolvida);
                return (
                  <article
                    key={item.id}
                    className="min-w-0 rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words font-bold text-slate-800">
                        {item.nome_produto}
                      </h3>
                      <strong className="shrink-0 text-sm">
                        × {item.quantidade}
                      </strong>
                    </div>
                    {Number(item.quantidade_devolvida) > 0 && (
                      <p className="mt-1 text-xs font-semibold text-amber-600">
                        {item.quantidade_devolvida} devolvida(s)
                      </p>
                    )}
                    <div className="mt-3 flex min-w-0 items-end justify-between gap-3 border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-xs text-slate-500">Preço unitário</p>
                        <p className="break-words text-sm">
                          {dinheiro(item.preco_unitario)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Total</p>
                        <b className="break-words">{dinheiro(item.total)}</b>
                      </div>
                    </div>
                    {podeEstornar && (
                      <button
                        type="button"
                        disabled={!restante || venda.estado === "cancelada"}
                        onClick={() => setDevolucao({ item, quantidade: 1 })}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-100 py-2 text-sm font-semibold text-indigo-600 disabled:text-slate-300"
                      >
                        <RotateCcw size={15} />
                        Devolver produto
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
            <div className="ml-auto mt-6 min-w-0 max-w-sm rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <p className="flex min-w-0 justify-between gap-4 text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="break-words text-right font-semibold">
                  {dinheiro(venda.subtotal)}
                </span>
              </p>
              <p className="mt-3 flex min-w-0 justify-between gap-4 text-sm text-slate-600">
                <span>Desconto</span>
                <span className="break-words text-right font-semibold">
                  {dinheiro(venda.desconto)}
                </span>
              </p>
              <p className="mt-4 flex min-w-0 justify-between gap-4 border-t border-slate-200 pt-4 text-xl font-extrabold text-slate-950">
                <span>Total</span>
                <span className="break-words text-right text-indigo-700">
                  {dinheiro(venda.total)}
                </span>
              </p>
              {Number(venda.troco) > 0 && (
                <p className="mt-3 flex min-w-0 justify-between gap-4 text-sm font-bold text-emerald-700">
                  <span>Troco</span>
                  <span className="break-words text-right">
                    {dinheiro(venda.troco)}
                  </span>
                </p>
              )}
            </div>
          </div>
          <footer className="receipt-footer hidden border-t border-slate-200 px-5 py-4 text-center text-xs text-slate-500 print:block">
            <p>Obrigado pela preferência.</p>
            <p className="mt-1">Este documento é um comprovativo de venda.</p>
          </footer>
        </section>
        {podeEstornar && venda.estado === "concluida" && (
          <div className="mt-4 flex justify-end print:hidden">
            <button
              type="button"
              onClick={() => setConfirmar(true)}
              className="rounded-xl px-4 py-2.5 font-semibold text-red-600 transition hover:bg-red-50"
            >
              Cancelar venda
            </button>
          </div>
        )}
      </div>
      {devolucao && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-lg font-bold">Registar devolução</h2>
            <p className="mt-2 break-words text-sm text-slate-600">
              {devolucao.item.nome_produto}
            </p>
            <label className="mt-4 block text-sm font-semibold">
              Quantidade
              <input
                autoFocus
                type="number"
                min="1"
                max={
                  Number(devolucao.item.quantidade) -
                  Number(devolucao.item.quantidade_devolvida)
                }
                value={devolucao.quantidade}
                onChange={(e) =>
                  setDevolucao({ ...devolucao, quantidade: e.target.value })
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDevolucao(null)}
                className="rounded-xl border border-slate-300 px-4 py-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={ocupada}
                onClick={() =>
                  postar(
                    `${API_URL}/vendas/${id}/itens/${devolucao.item.id}/devolver`,
                    { quantidade: Number(devolucao.quantidade) },
                  )
                }
                className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </section>
        </div>
      )}
      <ConfirmDialog
        aberto={confirmar}
        titulo="Cancelar esta venda?"
        descricao="O stock será reposto e a venda deixará de contar no faturamento."
        confirmarLabel="Cancelar venda"
        ocupada={ocupada}
        onCancelar={() => setConfirmar(false)}
        onConfirmar={() => postar(`${API_URL}/vendas/${id}/cancelar`)}
      />
    </main>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
      {Icon && (
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm">
          <Icon size={17} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-bold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

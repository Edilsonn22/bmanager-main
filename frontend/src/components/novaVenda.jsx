import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Barcode,
  Check,
  ChevronRight,
  CircleX,
  CreditCard,
  History,
  Minus,
  PackageSearch,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
} from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";
import { Feedback } from "./ui/Feedback";

const formatar = (valor) =>
  `${Number(valor || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN`;

export default function NovaVenda() {
  const navigate = useNavigate();
  const buscaRef = useRef(null);
  const [produtos, setProdutos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vendai.carrinho")) || [];
    } catch {
      return [];
    }
  });
  const [cliente, setCliente] = useState("");
  const [clienteAvulso, setClienteAvulso] = useState("");
  const [desconto, setDesconto] = useState(0);
  const [forma, setForma] = useState("dinheiro");
  const [recebido, setRecebido] = useState("");
  const [etapa, setEtapa] = useState(1);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [caixaAberto, setCaixaAberto] = useState(false);
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/produtos`).then((r) => r.json()),
      fetch(`${API_URL}/clientes`).then((r) => r.json()),
      fetch(`${API_URL}/caixa`).then((r) => r.json()),
    ])
      .then(([p, c, caixa]) => {
        if (!p.sucesso || !c.sucesso || !caixa.sucesso) throw new Error(p.erro || c.erro || caixa.erro);
        setProdutos(p.produtos || []);
        setClientes(c.clientes || []);
        setCaixaAberto(caixa.caixa?.estado === "aberto");
      })
      .catch((e) => setErro(e.message || "Não foi possível carregar os dados."))
      .finally(() => setCarregando(false));
  }, []);
  useEffect(
    () => localStorage.setItem("vendai.carrinho", JSON.stringify(itens)),
    [itens],
  );
  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return produtos
      .filter(
        (p) =>
          Number(p.quantidade) > 0 &&
          (!q || p.nome.toLowerCase().includes(q) || p.codigo_barras === q),
      )
      .slice(0, 12);
  }, [produtos, busca]);
  const subtotal = itens.reduce(
    (s, i) => s + i.quantidade * Number(i.preco),
    0,
  );
  const total = Math.max(0, subtotal - Number(desconto || 0));
  const troco =
    forma === "dinheiro" ? Math.max(0, Number(recebido || 0) - total) : 0;
  const adicionar = (p) =>
    setItens((atuais) => {
      const atual = atuais.find((i) => i.id === p.id);
      if (atual) {
        if (atual.quantidade >= Number(p.quantidade)) {
          setErro(`Stock disponível para ${p.nome}: ${p.quantidade}.`);
          return atuais;
        }
        return atuais.map((i) =>
          i.id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i,
        );
      }
      return [
        ...atuais,
        {
          id: p.id,
          nome: p.nome,
          preco: Number(p.preco),
          quantidade: 1,
          stock: Number(p.quantidade),
        },
      ];
    });
  const lerCodigo = (evento) => {
    if (evento.key !== "Enter") return;
    evento.preventDefault();
    const produto = produtos.find(
      (item) => item.codigo_barras && item.codigo_barras === busca.trim(),
    );
    if (!produto)
      return setErro("Nenhum produto possui este código de barras.");
    adicionar(produto);
    setBusca("");
  };
  const quantidade = (id, delta) =>
    setItens((atuais) =>
      atuais.map((i) =>
        i.id === id
          ? {
              ...i,
              quantidade: Math.min(i.stock, Math.max(1, i.quantidade + delta)),
            }
          : i,
      ),
    );
  const concluir = async () => {
    setErro("");
    if (forma === "credito" && !cliente) {
      setErro("Selecione um cliente para realizar uma venda a crédito.");
      return;
    }
    setEnviando(true);
    try {
      const r = await fetch(`${API_URL}/vendas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: itens.map((i) => ({
            produto_id: i.id,
            quantidade: i.quantidade,
          })),
          cliente_id: cliente || null,
          cliente_nome: cliente ? null : clienteAvulso.trim() || null,
          desconto: Number(desconto || 0),
          forma_pagamento: forma,
          valor_recebido: forma === "dinheiro" ? Number(recebido) : total,
        }),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(d.erro || "Não foi possível concluir a venda.");
      localStorage.removeItem("vendai.carrinho");
      setItens([]);
      navigate(`/vendas/${d.venda.id}?concluida=1`, { replace: true });
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  };
  return (
    <main className="commerce-page h-dvh w-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-7">
      <header className="commerce-header mb-5 flex min-w-0 flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">Ponto de venda</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Nova venda</h1>
          <p className="text-slate-600">
            Adicione produtos e conclua o pagamento.
          </p>
        </div>
        <Link
          to="/vendas"
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 hover:shadow-md sm:w-auto"
        >
          <History size={18} /> Histórico
        </Link>
      </header>
      <div className="mb-5 grid w-full max-w-xl grid-cols-[1fr_auto_1fr] items-center text-xs font-semibold sm:mb-6 sm:text-sm" aria-label="Progresso da venda">
        <span
          className={`flex min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-center ${etapa === 1 ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
        >
          <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] ${etapa === 1 ? "bg-white/20" : "bg-emerald-100"}`}>{etapa === 2 ? <Check size={13} /> : "1"}</span>
          Produtos
        </span>
        <span className={`h-px w-5 sm:w-10 ${etapa === 2 ? "bg-emerald-300" : "bg-slate-300"}`} aria-hidden="true" />
        <span
          className={`flex min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-center ${etapa === 2 ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200" : "border-slate-200 bg-white text-gray-500"}`}
        >
          <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] ${etapa === 2 ? "bg-white/20" : "bg-slate-100"}`}>2</span>
          Pagamento
        </span>
      </div>
      <Feedback tipo="erro" className="mb-4" onClose={() => setErro("")}>
        {erro}
      </Feedback>
      {!caixaAberto && !carregando && <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><span>Abra o caixa antes de concluir uma venda.</span><Link to="/caixa" className="shrink-0 font-bold text-amber-800 underline underline-offset-2">Ir para o caixa</Link></div>}
      {etapa === 1 ? (
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-5 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gradient-to-r from-white to-slate-50/70 p-4 sm:p-5">
              <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0"><h2 className="font-bold text-slate-900">Catálogo de produtos</h2><p className="text-xs text-slate-500">Selecione os itens que deseja vender</p></div>
                <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">{visiveis.length} disponíveis</span>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  ref={buscaRef}
                  autoFocus
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={lerCodigo}
                  placeholder="Pesquisar nome ou código de barras..."
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-20 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                {busca && <button type="button" onClick={() => { setBusca(""); buscaRef.current?.focus(); }} aria-label="Limpar pesquisa" className="absolute right-11 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><CircleX size={18} /></button>}
                <Barcode
                  className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-3 flex flex-col gap-1 text-xs text-gray-500 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <span className="min-w-0">
                  Digite para pesquisar ou leia o código e pressione Enter
                </span>
                <span className="shrink-0">Máximo de 12 resultados</span>
              </div>
            </div>
            <div className="min-h-72 max-w-full overflow-x-hidden overflow-y-auto sm:max-h-[calc(100dvh-19rem)]">
              <div className="sticky top-0 z-10 hidden min-w-0 grid-cols-[minmax(0,1fr)_80px_105px_96px] items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-500 xl:grid">
                <span>Produto</span>
                <span className="text-right">Stock</span>
                <span className="text-right">Preço</span>
                <span />
              </div>
              {carregando && (
                <p
                  className="py-16 text-center text-sm text-gray-500"
                  role="status"
                >
                  A carregar produtos...
                </p>
              )}
              {!carregando && !visiveis.length && (
                <div className="py-16 text-center">
                  <PackageSearch className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-3 font-semibold text-gray-700">
                    Nenhum produto disponível
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Verifique a pesquisa ou o nível de stock.
                  </p>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {visiveis.map((p) => {
                  const baixo =
                    Number(p.quantidade) <= Number(p.estoque_minimo || 5);
                  return (
                    <article
                      key={p.id}
                      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden px-3 py-3 hover:bg-gray-50 lg:px-4 xl:grid-cols-[minmax(0,1fr)_80px_105px_96px]"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600">
                          {p.nome?.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="whitespace-normal break-words text-sm font-semibold leading-5 text-gray-900">
                            {p.nome}
                          </h3>
                          <p className="mt-0.5 break-all text-xs text-gray-500">
                            {p.codigo_barras
                              ? `Código: ${p.codigo_barras}`
                              : "Sem código de barras"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 xl:hidden">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${baixo ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                            >
                              {p.quantidade} em stock
                            </span>
                            <b className="text-sm text-indigo-700">
                              {formatar(p.preco)}
                            </b>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`hidden max-w-full justify-self-end rounded-full px-2 py-1 text-right text-xs font-medium xl:inline-flex ${baixo ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                      >
                        {p.quantidade} un.
                      </span>
                      <strong className="hidden break-words text-right text-xs text-gray-900 xl:block">
                        {formatar(p.preco)}
                      </strong>
                      <button
                        type="button"
                        onClick={() => adicionar(p)}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                        aria-label={`Adicionar ${p.nome}`}
                      >
                        <Plus size={16} />
                        <span className="hidden xl:inline">Adicionar</span>
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
          <Carrinho
            itens={itens}
            subtotal={subtotal}
            total={total}
            desconto={desconto}
            setDesconto={setDesconto}
            quantidade={quantidade}
            remover={(id) => setItens((v) => v.filter((i) => i.id !== id))}
            limpar={() => setItens([])}
            avancar={() =>
              itens.length && caixaAberto
                ? setEtapa(2)
                : setErro(itens.length ? "Abra o caixa antes de continuar." : "Adicione pelo menos um produto.")
            }
          />
        </div>
      ) : (
        <section className="commerce-panel mx-auto w-full max-w-3xl overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-white to-indigo-50/50 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700"><CreditCard size={21} /></span><div><h2 className="text-xl font-bold text-slate-900">Finalizar pagamento</h2><p className="text-sm text-slate-500">Confirme o cliente e a forma de pagamento.</p></div></div></div>
          <div className="p-5 sm:p-6">
          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1.5 flex items-center gap-2"><UserRound size={16} className="text-slate-400" />
            Cliente (opcional)
            </span>
            <select
              value={cliente}
              onChange={(e) => {
                setCliente(e.target.value);
                if (e.target.value) setClienteAvulso("");
              }}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Consumidor final</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </label>
          {!cliente && (
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Nome do cliente desta venda
              <input
                type="text"
                maxLength="255"
                value={clienteAvulso}
                onChange={(e) => setClienteAvulso(e.target.value)}
                placeholder="Ex.: Ana Manuel (opcional)"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <span className="mt-1.5 block text-xs font-normal text-slate-500">
                O nome ficará apenas nesta venda e não criará um cadastro.
              </span>
            </label>
          )}
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            <span className="mb-1.5 flex items-center gap-2"><CreditCard size={16} className="text-slate-400" />Forma de pagamento</span>
            <select
              value={forma}
              onChange={(e) => setForma(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {[
                ["dinheiro", "Dinheiro"],
                ["mpesa", "M-Pesa"],
                ["emola", "e-Mola"],
                ["cartao", "Cartão"],
                ["transferencia", "Transferência"],
                ["credito", "Crédito"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {forma === "dinheiro" && (
            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Valor recebido
              <input
                type="number"
                min={total}
                step="0.01"
                value={recebido}
                onChange={(e) => setRecebido(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </label>
          )}
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 sm:p-5">
            <p className="flex min-w-0 justify-between gap-4 text-slate-600">
              <span>Total</span>
              <strong className="break-words text-right text-xl text-slate-900">{formatar(total)}</strong>
            </p>
            {forma === "dinheiro" && (
              <p className="mt-3 flex min-w-0 justify-between gap-4 border-t border-indigo-100 pt-3 text-emerald-700">
                <span>Troco</span>
                <strong className="break-words text-right">{formatar(troco)}</strong>
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setEtapa(1)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:min-w-32"
            >
              Voltar
            </button>
            <button
              type="button"
              disabled={
                enviando || (forma === "dinheiro" && Number(recebido) < total)
              }
              onClick={concluir}
              className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:translate-y-0 disabled:opacity-50 sm:min-w-52"
            >
              {enviando ? "A concluir..." : "Concluir venda"}
            </button>
          </div>
          </div>
        </section>
      )}
    </main>
  );
}

function Carrinho({
  itens,
  subtotal,
  total,
  desconto,
  setDesconto,
  quantidade,
  remover,
  limpar,
  avancar,
}) {
  return (
    <aside className="commerce-panel min-w-0 self-start overflow-hidden lg:sticky lg:top-6">
      <div className="flex min-w-0 items-center border-b border-gray-100 bg-gradient-to-r from-white to-indigo-50/50 p-4 sm:p-5">
        <span className="mr-3 grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700"><ShoppingCart size={19} /></span>
        <h2 className="min-w-0 font-bold text-gray-900">
          Resumo da venda
          <span className="ml-2 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
            {itens.length}
          </span>
        </h2>
        {Boolean(itens.length) && (
          <button
            type="button"
            onClick={limpar}
            className="ml-auto text-xs font-semibold text-red-600 hover:underline"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="max-h-[45dvh] max-w-full space-y-3 overflow-x-hidden overflow-y-auto p-4 sm:p-5 lg:max-h-[calc(100dvh-27rem)]">
        {!itens.length && (
          <div className="py-12 text-center">
            <ShoppingCart className="mx-auto h-9 w-9 text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-600">
              O carrinho está vazio
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Selecione um produto para começar.
            </p>
          </div>
        )}
        {itens.map((i) => (
          <div
            key={i.id}
            className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-200"
          >
            <div className="flex justify-between gap-2">
              <strong className="min-w-0 flex-1 break-words">{i.nome}</strong>
              <button
                type="button"
                aria-label={`Remover ${i.nome}`}
                onClick={() => remover(i.id)}
              >
                <Trash2 size={17} className="text-red-600" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Diminuir quantidade"
                  onClick={() => quantidade(i.id, -1)}
                  className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                >
                  <Minus size={15} />
                </button>
                <span className="min-w-6 text-center text-sm font-bold">
                  {i.quantidade}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade"
                  onClick={() => quantidade(i.id, 1)}
                  className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                >
                  <Plus size={15} />
                </button>
              </div>
              <b className="min-w-0 break-words text-right">
                {formatar(i.quantidade * i.preco)}
              </b>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 p-4 sm:p-5"><label className="block text-sm font-semibold text-slate-700">
        Desconto (MZN)
        <input
          type="number"
          min="0"
          max={subtotal}
          step="0.01"
          value={desconto}
          onChange={(e) => setDesconto(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white p-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="flex min-w-0 justify-between gap-3 text-sm">
          <span>Subtotal</span>
          <span className="min-w-0 break-words text-right">
            {formatar(subtotal)}
          </span>
        </p>
        <p className="mt-3 flex min-w-0 justify-between gap-3 border-t border-slate-200 pt-3 text-lg">
          <strong>Total</strong>
          <strong className="min-w-0 break-words text-right">
            {formatar(total)}
          </strong>
        </p>
      </div>
      <button
        type="button"
        onClick={avancar}
        disabled={!itens.length}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 p-3 font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:translate-y-0 disabled:opacity-50"
      >
        Continuar para pagamento <ChevronRight size={18} />
      </button>
      </div>
    </aside>
  );
}

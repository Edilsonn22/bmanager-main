import { createElement, useCallback, useEffect, useState } from "react";
import {
  Banknote,
  Clock3,
  FileText,
  LockKeyhole,
  Printer,
  ReceiptText,
  WalletCards,
  X,
} from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";
import { Feedback } from "./ui/Feedback";
import vendaiLogo from "../assets/vendai-logo.png";

const dinheiro = (valor) =>
  `${Number(valor || 0).toLocaleString("pt-MZ", { minimumFractionDigits: 2 })} MZN`;
const dataHora = (valor) =>
  valor ? new Date(valor).toLocaleString("pt-MZ") : "—";
const segundosDecorridos = (inicio, fim = Date.now()) => {
  const inicioMs = new Date(inicio).getTime();
  const fimMs = new Date(fim).getTime();
  if (!Number.isFinite(inicioMs) || !Number.isFinite(fimMs)) return 0;
  return Math.max(0, Math.floor((fimMs - inicioMs) / 1000));
};
const relogioCaixa = (inicio, fim = Date.now()) => {
  const total = segundosDecorridos(inicio, fim);
  const horas = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutos = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const segundos = String(total % 60).padStart(2, "0");
  return `${horas}:${minutos}:${segundos}`;
};
const duracaoCaixa = (inicio, fim) => {
  const total = segundosDecorridos(inicio, fim);
  const horas = Math.floor(total / 3600);
  const minutos = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  return `${horas} h ${minutos} min`;
};
const nomeMetodo = (forma) =>
  ({
    dinheiro: "Dinheiro",
    mpesa: "M-Pesa",
    emola: "e-Mola",
    cartao: "Cartão",
    transferencia: "Transferência",
    credito: "Crédito",
  })[forma] || forma;

export default function Caixa() {
  const [dados, setDados] = useState(null);
  const [operacoes, setOperacoes] = useState([]);
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const [carregandoCaixa, setCarregandoCaixa] = useState(true);
  const [relatorio, setRelatorio] = useState(null);
  const [aberturaSelecionada, setAberturaSelecionada] = useState(null);
  const [instanteAtual, setInstanteAtual] = useState(() => Date.now());

  const carregar = useCallback(async () => {
    setErro("");
    setCarregandoCaixa(true);
    try {
      const [respostaCaixa, respostaRelatorios] = await Promise.all([
        fetch(`${API_URL}/caixa`),
        fetch(`${API_URL}/caixa/relatorios`),
      ]);
      const [conteudo, conteudoRelatorios] = await Promise.all([
        respostaCaixa.json(),
        respostaRelatorios.json(),
      ]);
      if (!respostaCaixa.ok) throw new Error(conteudo.erro);
      if (!respostaRelatorios.ok) throw new Error(conteudoRelatorios.erro);
      setDados(conteudo);
      setOperacoes(conteudoRelatorios.operacoes || []);
    } catch (error) {
      setErro(error.message || "Não foi possível carregar o caixa.");
    } finally {
      setCarregandoCaixa(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const aberto = dados?.caixa?.estado === "aberto";
  useEffect(() => {
    if (!aberto) return undefined;
    setInstanteAtual(Date.now());
    const intervalo = window.setInterval(() => setInstanteAtual(Date.now()), 1000);
    return () => window.clearInterval(intervalo);
  }, [aberto]);

  const esperado =
    Number(dados?.caixa?.valor_abertura || 0) +
    Number(dados?.totais?.dinheiro || 0);

  const executar = async () => {
    setLoading(true);
    setErro("");
    setSucesso("");
    try {
      const url = aberto
        ? `${API_URL}/caixa/${dados.caixa.id}/fechar`
        : `${API_URL}/caixa/abrir`;
      const corpo = aberto
        ? { valor_fecho: Number(valor) }
        : { valor_abertura: Number(valor || 0) };
      const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      const conteudo = await resposta.json();
      if (!resposta.ok) throw new Error(conteudo.erro);
      if (aberto) {
        setSucesso(
          `Caixa fechado. Diferença apurada: ${dinheiro(conteudo.fecho?.diferenca)}.`,
        );
        setRelatorio(conteudo.relatorio);
      } else setSucesso("Caixa aberto e pronto para vender.");
      setValor("");
      await carregar();
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  const consultarRelatorio = async () => {
    setLoading(true);
    setErro("");
    try {
      const resposta = await fetch(
        `${API_URL}/caixa/${dados.caixa.id}/relatorio`,
      );
      const conteudo = await resposta.json();
      if (!resposta.ok) throw new Error(conteudo.erro);
      setRelatorio(conteudo.relatorio);
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="commerce-page h-dvh min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-7">
      <div className="mx-auto max-w">
        <header className="commerce-header">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">
              Operação diária
            </p>
            <h1>Caixa</h1>
            <p className="text-slate-600">
              Acompanhe o turno, confira os valores e faça o fecho com
              segurança.
            </p>
          </div>
        </header>
        <div className="my-5 space-y-3">
          <Feedback tipo="erro">{erro}</Feedback>
          <Feedback tipo="sucesso">{sucesso}</Feedback>
          {!dados && !carregandoCaixa && (
            <button
              type="button"
              onClick={carregar}
              className="text-sm font-bold text-indigo-700 underline underline-offset-4 hover:text-indigo-900"
            >
              Tentar carregar novamente
            </button>
          )}
        </div>

        <section className="commerce-panel overflow-hidden border-t-4 border-t-indigo-600">
          <div>
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex items-center gap-4">
                  <span
                    className={`grid size-12 place-items-center rounded-xl ${aberto ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    <Banknote size={23} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Estado atual
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {dados
                        ? aberto
                          ? "Caixa aberto"
                          : "Caixa fechado"
                        : carregandoCaixa
                          ? "A carregar..."
                          : "Caixa indisponível"}
                    </h2>
                  </div>
                </div>
                {aberto ? (
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400">
                      Responsável pelo turno
                    </p>
                    <b className="mt-0.5 block text-sm text-slate-800">
                      {dados.caixa.operador}
                    </b>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 sm:justify-end">
                      <Clock3 size={13} />
                      {dataHora(dados.caixa.aberto_em)}
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-emerald-700 sm:text-right">
                      Caixa aberta há {relogioCaixa(dados.caixa.aberto_em, instanteAtual)}
                    </p>
                  </div>
                ) : (
                  dados?.caixa && (
                    <button
                      type="button"
                      onClick={consultarRelatorio}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
                    >
                      <FileText size={17} />
                      {loading ? "A carregar..." : "Último relatório"}
                    </button>
                  )
                )}
              </div>
            </div>

            {aberto && (
              <div className="grid gap-px border-y border-slate-100 bg-slate-100 sm:grid-cols-3">
                <Metrica
                  icon={ReceiptText}
                  label="Vendas concluídas"
                  value={dados.totais.vendas}
                />
                <Metrica
                  icon={WalletCards}
                  label="Total vendido"
                  value={dinheiro(dados.totais.total)}
                />
                <Metrica
                  icon={Banknote}
                  label="Dinheiro esperado"
                  value={dinheiro(esperado)}
                  destaque
                />
              </div>
            )}
          </div>

          <div className="grid border-t border-slate-100 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-5 sm:p-7">
              <span
                className={`grid size-10 place-items-center rounded-xl ${aberto ? "bg-slate-100 text-slate-700" : "bg-indigo-50 text-indigo-700"}`}
              >
                {aberto ? <LockKeyhole size={19} /> : <Banknote size={19} />}
              </span>
              <h3 className="mt-3 font-bold text-slate-900">
                {!dados
                  ? carregandoCaixa
                    ? "A carregar caixa..."
                    : "Caixa indisponível"
                  : aberto
                    ? "Fechar caixa"
                    : "Abrir novo caixa"}
              </h3>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                {!dados
                  ? carregandoCaixa
                    ? "Aguarde enquanto verificamos o estado do caixa."
                    : "Não foi possível confirmar o estado atual. Carregue novamente antes de abrir ou fechar o caixa."
                  : aberto
                    ? "Conte o dinheiro físico disponível. O valor esperado corresponde ao fundo inicial somado às vendas recebidas em dinheiro."
                    : "Informe o fundo inicial reservado para trocos antes de começar a registar vendas."}
              </p>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/50 p-5 lg:border-l lg:border-t-0">
              <label className="block text-sm font-semibold text-slate-700">
                {aberto ? "Dinheiro contado" : "Fundo inicial"}
                <div className="relative mt-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valor}
                    disabled={!dados || carregandoCaixa || loading}
                    onChange={(evento) => {
                      const novoValor = evento.target.value.replace(",", ".");
                      if (/^\d*\.?\d{0,2}$/.test(novoValor))
                        setValor(novoValor);
                    }}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3.5 pr-16 text-lg font-bold outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    MZN
                  </span>
                </div>
              </label>
              {aberto && valor !== "" && (
                <div
                  className={`mt-3 rounded-xl p-3 text-sm ${Number(valor) - esperado === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
                >
                  <span className="block text-xs opacity-75">
                    Diferença estimada
                  </span>
                  <b className="mt-0.5 block">
                    {dinheiro(Number(valor) - esperado)}
                  </b>
                </div>
              )}
              <button
                type="button"
                onClick={executar}
                disabled={!dados || carregandoCaixa || loading || (aberto && valor === "")}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 p-3 font-bold text-white shadow-md shadow-indigo-100 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "A processar..."
                  : aberto
                    ? "Confirmar fecho"
                    : "Abrir caixa"}
              </button>
            </div>
          </div>
        </section>
        <section className="commerce-panel mt-6 overflow-hidden">
          <header className="border-b border-slate-100 p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">
              Arquivo operacional
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Aberturas e fechos de caixa
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Registos guardados por turno, com comprovativos identificados por
              código.
            </p>
          </header>
          {operacoes.length ? (
            <ul className="divide-y divide-slate-100">
              {operacoes.map((operacao) => (
                <li
                  key={operacao.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-mono text-sm font-bold text-slate-900">
                        {operacao.codigo_abertura}
                      </code>
                      {operacao.codigo_fecho && (
                        <code className="font-mono text-xs font-semibold text-slate-500">
                          {operacao.codigo_fecho}
                        </code>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${operacao.estado === "aberto" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {operacao.estado === "aberto" ? "Aberto" : "Fechado"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {dataHora(operacao.aberto_em)} · {operacao.operador} ·
                      Fundo {dinheiro(operacao.valor_abertura)}
                    </p>
                    {operacao.fechado_em && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Fechado {dataHora(operacao.fechado_em)}
                        {operacao.fechado_por
                          ? ` · ${operacao.fechado_por}`
                          : ""}{" "}
                        · Contado {dinheiro(operacao.valor_fecho)}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                      {operacao.fechado_em
                        ? `Duração: ${duracaoCaixa(operacao.aberto_em, operacao.fechado_em)}`
                        : `Em curso: ${relogioCaixa(operacao.aberto_em, instanteAtual)}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setAberturaSelecionada(operacao)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <FileText size={15} />
                      Abertura
                    </button>
                    {operacao.resumo_fecho && (
                      <button
                        type="button"
                        onClick={() => setRelatorio(operacao.resumo_fecho)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        <ReceiptText size={15} />
                        Fecho
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-sm text-slate-500">
              Ainda não existem operações de caixa registadas.
            </p>
          )}
        </section>
      </div>
      {relatorio && (
        <RelatorioFecho
          relatorio={relatorio}
          fechar={() => setRelatorio(null)}
        />
      )}
      {aberturaSelecionada && (
        <RelatorioAbertura
          operacao={aberturaSelecionada}
          fechar={() => setAberturaSelecionada(null)}
        />
      )}
    </main>
  );
}

function Metrica({ icon, label, value, destaque }) {
  return (
    <article
      className={`p-5 sm:p-6 ${destaque ? "bg-indigo-50/70" : "bg-white"}`}
    >
      {createElement(icon, {
        size: 18,
        className: destaque ? "text-indigo-600" : "text-slate-400",
      })}
      <small className="mt-3 block text-slate-500">{label}</small>
      <b
        className={`mt-1 block text-lg ${destaque ? "text-indigo-800" : "text-slate-900"}`}
      >
        {value}
      </b>
    </article>
  );
}

function RelatorioFecho({ relatorio, fechar }) {
  const vendas = relatorio.vendas || {};
  return (
    <div className="cash-close-overlay fixed inset-0 z-[120] overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-5xl justify-end gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700"
        >
          <Printer size={17} />
          Imprimir / PDF
        </button>
        <button
          type="button"
          onClick={fechar}
          className="grid size-11 place-items-center rounded-xl bg-white text-slate-600"
        >
          <X size={20} />
        </button>
      </div>
      <article className="cash-close-report mx-auto min-h-[280mm] w-full max-w-[210mm] bg-white p-8 text-slate-900 shadow-2xl print:min-h-0 print:max-w-none print:p-0 print:shadow-none sm:p-10">
        <header className="grid grid-cols-1 items-start gap-5 border-b-2 border-slate-800 pb-6 sm:grid-cols-[minmax(0,1fr)_minmax(150px,0.8fr)] print:grid-cols-[minmax(0,1fr)_minmax(150px,0.8fr)]">
          <div>
            <img
              src={vendaiLogo}
              alt="Vendaí"
              className="mb-4 block h-auto w-30 max-w-full object-contain object-left print:w-30"
            />
            <h1 className="text-base font-bold text-slate-900">
              {relatorio.empresa?.nome}
            </h1>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              {relatorio.empresa?.endereco || "Moçambique"}
            </p>
            <p className="text-xs leading-5 text-slate-600">
              NUIT: {relatorio.empresa?.nuit || "—"} · Contacto:{" "}
              {relatorio.empresa?.telefone || "—"}
            </p>
          </div>
          <div className="border-t border-slate-200 pt-4 text-left sm:border-l sm:border-t-0 sm:pt-0 sm:pl-4 sm:text-right print:border-l print:border-t-0 print:pt-0 print:pl-4 print:text-right">
            <p className="text-xs font-bold uppercase text-slate-600">
              Documento interno
            </p>
            <h2 className="mt-2 text-2xl font-bold uppercase leading-tight text-slate-900">
              Fecho de Caixa
            </h2>
            <p className="mt-3 text-[10px] font-semibold uppercase text-slate-500">
              Código do documento
            </p>
            <p className="mt-1 break-all font-mono text-sm font-bold text-slate-800">
              {relatorio.codigo}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 border-b border-slate-300 py-6 sm:grid-cols-2 print:grid-cols-2">
          <div>
            <h3 className="border-b border-slate-200 pb-2 text-xs font-bold uppercase text-slate-700">
              Período e operador
            </h3>
            <dl className="mt-3 grid grid-cols-[minmax(86px,120px)_1fr] gap-x-3 gap-y-2 text-xs sm:text-sm">
              <dt className="text-slate-500">Abertura</dt>
              <dd className="font-medium">{dataHora(relatorio.caixa?.aberto_em)}</dd>
              <dt className="text-slate-500">Fecho</dt>
              <dd className="font-medium">{dataHora(relatorio.caixa?.fechado_em)}</dd>
              <dt className="text-slate-500">Duração</dt>
              <dd className="font-medium">
                {duracaoCaixa(relatorio.caixa?.aberto_em, relatorio.caixa?.fechado_em)}
              </dd>
              <dt className="text-slate-500">Operador</dt>
              <dd className="font-medium">{relatorio.caixa?.operador}</dd>
              <dt className="text-slate-500">Fechado por</dt>
              <dd className="font-medium">{relatorio.caixa?.fechado_por}</dd>
            </dl>
          </div>
          <div>
            <h3 className="border-b border-slate-200 pb-2 text-xs font-bold uppercase text-slate-700">
              Resumo do turno
            </h3>
            <dl className="mt-3 grid grid-cols-[minmax(105px,150px)_1fr] gap-x-3 gap-y-2 text-xs sm:text-sm">
              <dt className="text-slate-500">Vendas concluídas</dt>
              <dd className="font-medium">{vendas.quantidade || 0}</dd>
              <dt className="text-slate-500">Artigos vendidos</dt>
              <dd className="font-medium">{vendas.artigos || 0}</dd>
              <dt className="text-slate-500">Vendas canceladas</dt>
              <dd className="font-medium">{vendas.canceladas || 0}</dd>
              <dt className="text-slate-500">Itens devolvidos</dt>
              <dd className="font-medium">{vendas.devolvidos || 0}</dd>
            </dl>
          </div>
        </section>

        <section>
          <h3 className="mb-3 mt-6 text-sm font-bold uppercase text-slate-800">
            Reconciliação de pagamentos
          </h3>
          <table className="w-full table-fixed border-collapse text-[10px]">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[16%]" />
            </colgroup>
              <thead>
                <tr className="border-y border-slate-700 bg-slate-100 text-left text-[10px] font-bold uppercase text-slate-700">
                  <th className="px-1 py-2">Meio de pagamento</th>
                  <th className="px-1 py-2 text-right">Abertura</th>
                  <th className="px-1 py-2 text-right">Recebido</th>
                  <th className="px-1 py-2 text-right">Esperado</th>
                  <th className="px-1 py-2 text-right">Fecho</th>
                  <th className="px-1 py-2 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.metodos?.map((metodo) => (
                  <tr key={metodo.forma} className="border-b border-slate-200">
                    <td className="px-1 py-2 font-semibold leading-4">
                      {nomeMetodo(metodo.forma)}
                    </td>
                    <td className="px-1 py-2 text-right tabular-nums leading-4">
                      {dinheiro(metodo.abertura)}
                    </td>
                    <td className="px-1 py-2 text-right tabular-nums leading-4">
                      {dinheiro(metodo.recebido)}
                    </td>
                    <td className="px-1 py-2 text-right tabular-nums leading-4">
                      {dinheiro(metodo.esperado)}
                    </td>
                    <td className="px-1 py-2 text-right tabular-nums leading-4">
                      {dinheiro(metodo.contado)}
                    </td>
                    <td
                      className={`px-1 py-2 text-right font-bold tabular-nums leading-4 ${Number(metodo.diferenca) ? "text-red-700" : "text-slate-800"}`}
                    >
                      {dinheiro(metodo.diferenca)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </section>

        <section className="ml-auto mt-7 max-w-sm space-y-2 border-t border-slate-300 pt-4 text-sm">
          <p className="flex justify-between">
            <span className="text-slate-600">Subtotal das vendas</span>
            <span className="tabular-nums">{dinheiro(vendas.subtotal)}</span>
          </p>
          <p className="flex justify-between text-slate-600">
            <span>Descontos concedidos</span>
            <span className="tabular-nums">- {dinheiro(vendas.descontos)}</span>
          </p>
          <p className="flex justify-between text-slate-600">
            <span>Devoluções</span>
            <span className="tabular-nums">- {dinheiro(vendas.devolucoes)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-slate-600">Valor cancelado</span>
            <span className="tabular-nums">{dinheiro(vendas.valor_cancelado)}</span>
          </p>
          <p className="flex justify-between border-t-2 border-slate-800 pt-3 text-base font-extrabold">
            <span>TOTAL VENDIDO LÍQUIDO</span>
            <span className="tabular-nums">{dinheiro(vendas.total)}</span>
          </p>
        </section>
        <footer className="mt-14 grid grid-cols-1 gap-10 pt-10 text-center text-xs text-slate-700 sm:grid-cols-2 print:grid-cols-2">
          <div className="border-t border-slate-500 pt-2">
            Operador responsável
          </div>
          <div className="border-t border-slate-500 pt-2">
            Gestor / Administrador
          </div>
        </footer>
        <p className="mt-8 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500">
          Documento interno de controlo · {relatorio.codigo}
        </p>
      </article>
    </div>
  );
}

function RelatorioAbertura({ operacao, fechar }) {
  return (
    <div className="cash-close-overlay fixed inset-0 z-[120] overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-3xl justify-end gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-bold text-white hover:bg-emerald-700"
        >
          <Printer size={17} />
          Imprimir / PDF
        </button>
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar comprovativo"
          className="grid size-11 place-items-center rounded-xl bg-white text-slate-600"
        >
          <X size={20} />
        </button>
      </div>
      <article className="cash-opening-report mx-auto min-h-[620px] max-w-3xl bg-white p-8 text-slate-900 shadow-2xl print:min-h-0 print:max-w-none print:p-0 print:shadow-none sm:p-12">
        <header className="flex flex-col gap-6 border-b-2 border-slate-900 pb-7 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <img
              src={vendaiLogo}
              alt="Vendaí"
              className="mb-4 block h-auto w-30 max-w-full object-contain object-left print:w-30"
            />
            <p className="mt-2 text-xs font-bold uppercase tracking-[.18em] text-slate-500">
              Documento interno
            </p>
            <h1 className="mt-2 text-2xl font-extrabold">Abertura de caixa</h1>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase text-slate-500">
              Código da operação
            </p>
            <code className="mt-1 block font-mono text-lg font-bold">
              {operacao.codigo_abertura}
            </code>
          </div>
        </header>
        <dl className="mt-8 grid grid-cols-[minmax(130px,0.8fr)_1.2fr] gap-x-4 gap-y-4 text-sm">
          <dt className="text-slate-500">Estado</dt>
          <dd className="font-semibold">
            {operacao.estado === "aberto" ? "Aberto" : "Fechado"}
          </dd>
          <dt className="text-slate-500">Data e hora</dt>
          <dd className="font-semibold">{dataHora(operacao.aberto_em)}</dd>
          <dt className="text-slate-500">Operador</dt>
          <dd className="font-semibold">{operacao.operador}</dd>
          <dt className="text-slate-500">Fundo inicial</dt>
          <dd className="font-semibold">{dinheiro(operacao.valor_abertura)}</dd>
          <dt className="text-slate-500">ID interno</dt>
          <dd className="font-mono text-slate-600">
            #{String(operacao.id).padStart(6, "0")}
          </dd>
        </dl>
        {operacao.codigo_fecho && (
          <p className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-600">
            Esta operação também tem fecho registado sob o código{" "}
            <code className="font-mono font-bold text-slate-900">
              {operacao.codigo_fecho}
            </code>
            . Consulte o comprovativo de fecho no arquivo de operações.
          </p>
        )}
        <footer className="mt-20 border-t border-slate-400 pt-2 text-center text-sm">
          Operador responsável
        </footer>
      </article>
    </div>
  );
}

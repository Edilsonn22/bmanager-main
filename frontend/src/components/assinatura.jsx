import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api/authenticatedFetch";

const formatarData = (data) => data ? new Date(data).toLocaleDateString("pt-MZ") : "sem expiração";

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

  const carregar = useCallback(async () => {
    const [respostaPlanos, respostaAssinatura, respostaAcesso] = await Promise.all([
      fetch(`${API_URL}/planos`),
      fetch(`${API_URL}/assinaturas/minha`),
      fetch(`${API_URL}/plataforma/acesso`),
    ]);
    const [dadosPlanos, dadosAssinatura, dadosAcesso] = await Promise.all([
      respostaPlanos.json(), respostaAssinatura.json(), respostaAcesso.json(),
    ]);
    if (!respostaPlanos.ok || !respostaAssinatura.ok) throw new Error(dadosPlanos.erro || dadosAssinatura.erro || "Não foi possível carregar os planos.");
    setPlanos(dadosPlanos.planos || []);
    setAssinatura(dadosAssinatura.assinatura || null);
    setProprietario(Boolean(dadosAcesso.proprietario));
  }, []);

  useEffect(() => {
    carregar().catch((error) => setErro(error.message)).finally(() => setCarregando(false));
  }, [carregar]);

  const iniciarPagamento = async (event) => {
    event.preventDefault();
    const planoId = planoPagamento.id;
    setErro(""); setMensagem(""); setProcessando(planoId);
    try {
      const resposta = await fetch(`${API_URL}/pagamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planoId, method: metodo, phone: telefone }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível iniciar o pagamento.");
      if (!dados.pagamento?.id) throw new Error("A Débito não devolveu a referência do pagamento.");
      if (dados.pagamento.checkout_url) return window.location.assign(dados.pagamento.checkout_url);
      setPagamentoPendente(dados.pagamento);
      setPlanoPagamento(null);
      setMensagem("Pedido enviado. Confirme o pagamento no seu telemóvel.");
    } catch (error) {
      setErro(error.message); setProcessando(null);
    }
  };

  useEffect(() => {
    if (!pagamentoPendente?.id) return undefined;
    let tentativas = 0;
    const consultar = async () => {
      tentativas += 1;
      try {
        const resposta = await fetch(`${API_URL}/pagamentos/${encodeURIComponent(pagamentoPendente.id)}`);
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível consultar o pagamento.");
        if (dados.pagamento?.status === "pago") {
          setMensagem("Pagamento confirmado. A sua assinatura já está ativa.");
          setPagamentoPendente(null); setProcessando(null); await carregar();
        } else if (dados.pagamento?.status === "falhou") {
          setErro("O pagamento não foi concluído. Pode tentar novamente.");
          setPagamentoPendente(null); setProcessando(null);
        }
      } catch (error) {
        if (tentativas >= 20) { setErro(error.message); setPagamentoPendente(null); setProcessando(null); }
      }
    };
    consultar();
    const intervalo = window.setInterval(() => {
      if (tentativas >= 20) {
        window.clearInterval(intervalo);
        setMensagem("O pagamento continua pendente. Consulte o histórico dentro de alguns instantes.");
        setPagamentoPendente(null);
        setProcessando(null);
      } else consultar();
    }, 5000);
    return () => window.clearInterval(intervalo);
  }, [pagamentoPendente?.id, carregar]);

  const agendarDowngrade = async (planoId) => {
    setErro(""); setMensagem(""); setProcessando(planoId);
    try {
      const resposta = await fetch(`${API_URL}/assinaturas/downgrade`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planoId }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível agendar o downgrade.");
      setMensagem(dados.mensagem); await carregar();
    } catch (error) {
      setErro(error.message);
    } finally {
      setProcessando(null);
    }
  };

  const alterarCancelamento = async (rota) => {
    setErro(""); setMensagem(""); setProcessando("cancelamento");
    try {
      const resposta = await fetch(`${API_URL}/assinaturas/${rota}`, { method: "POST" });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível alterar a renovação.");
      setMensagem(dados.mensagem); await carregar();
    } catch (error) {
      setErro(error.message);
    } finally {
      setProcessando(null);
    }
  };

  if (carregando) return <main className="flex-1 overflow-auto p-8">A carregar planos…</main>;

  return (
    <main className="flex-1 overflow-auto p-8">
      <h2 className="text-2xl font-bold text-gray-900">Plano e assinatura</h2>
      <p className="mt-1 text-gray-600">Upgrade entra em vigor após pagamento confirmado. Downgrade só vale na próxima renovação.</p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-indigo-600">
        <Link to="/historico-pagamentos">Histórico e faturas</Link>
        <Link to="/notificacoes">Notificações</Link>
        {proprietario && <Link to="/admin/planos">Gerir planos</Link>}
        {proprietario && <Link to="/admin/sistema">Painel do proprietário</Link>}
      </div>

      {assinatura && (
        <section className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-indigo-950">
          <p>Plano atual: <strong>{assinatura.plano_nome}</strong> · estado: <strong className="capitalize">{assinatura.status}</strong></p>
          <p className="mt-1 text-sm">Período atual termina em {formatarData(assinatura.expira_em)}.</p>
          {assinatura.plano_pendente_nome && <p className="mt-1 text-sm">Próxima renovação: <strong>{assinatura.plano_pendente_nome}</strong>.</p>}
          {assinatura.cancelamento_agendado_em ? (
            <div className="mt-3"><p className="text-sm text-amber-800">Renovação cancelada para {formatarData(assinatura.cancelamento_agendado_em)}.</p><button type="button" disabled={processando !== null} onClick={() => alterarCancelamento("reativar")} className="mt-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">Reativar renovação</button></div>
          ) : (
            <button type="button" disabled={processando !== null || assinatura.status !== "ativa"} onClick={() => alterarCancelamento("cancelar")} className="mt-3 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60">Cancelar renovação</button>
          )}
        </section>
      )}
      {mensagem && <p className="mt-4 rounded-xl bg-green-50 p-4 text-green-800">{mensagem}</p>}
      {erro && <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">{erro}</p>}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {planos.map((plano) => {
          const atual = assinatura?.plano_id === plano.id;
          const downgrade = assinatura && Number(plano.valor) < Number(assinatura.valor);
          const texto = atual ? "Plano atual" : downgrade ? "Agendar downgrade" : "Fazer upgrade / renovar";
          return <section key={plano.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900">{plano.nome}</h3>
            <p className="mt-2 min-h-12 text-gray-600">{plano.descricao}</p>
            <p className="mt-5 text-3xl font-bold text-indigo-600">{Number(plano.valor).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</p>
            <p className="text-sm text-gray-500">por {plano.periodo_meses} {plano.periodo_meses === 1 ? "mês" : "meses"}</p>
            <button type="button" disabled={atual || processando !== null} onClick={() => downgrade ? agendarDowngrade(plano.id) : setPlanoPagamento(plano)} className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{processando === plano.id ? "A processar…" : texto}</button>
          </section>;
        })}
      </div>
      {planoPagamento && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-pagamento">
        <form onSubmit={iniciarPagamento} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><h3 id="titulo-pagamento" className="text-xl font-bold text-slate-900">Pagar com Débito</h3><p className="mt-1 text-sm text-slate-600">{planoPagamento.nome} · {Number(planoPagamento.valor).toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</p></div><button type="button" onClick={() => setPlanoPagamento(null)} className="rounded-lg px-2 py-1 text-xl text-slate-500" aria-label="Fechar">×</button></div>
          <fieldset className="mt-6"><legend className="text-sm font-semibold text-slate-700">Operadora</legend><div className="mt-2 grid grid-cols-2 gap-3">{[["mpesa", "M-Pesa"], ["emola", "eMola"]].map(([valor, nome]) => <label key={valor} className={`cursor-pointer rounded-xl border p-3 text-center font-semibold ${metodo === valor ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200"}`}><input type="radio" name="metodo" value={valor} checked={metodo === valor} onChange={(e) => setMetodo(e.target.value)} className="sr-only" />{nome}</label>)}</div></fieldset>
          <label className="mt-5 block text-sm font-semibold text-slate-700">Número de telefone<input required inputMode="tel" autoComplete="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Ex.: 851234567 ou +258 85 123 4567" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100" /></label>
          <p className="mt-3 text-xs leading-5 text-slate-500">Receberá uma solicitação no telemóvel para confirmar com o seu PIN. O Vendai nunca solicita nem guarda o PIN.</p>
          <button disabled={processando !== null} className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">{processando ? "A enviar…" : "Enviar pedido de pagamento"}</button>
        </form>
      </div>}
    </main>
  );
}

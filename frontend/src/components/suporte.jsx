import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, CircleHelp, MessageSquarePlus, Send } from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";

const corEstado = {
  aberto: "bg-blue-100 text-blue-700",
  em_andamento: "bg-amber-100 text-amber-700",
  resolvido: "bg-emerald-100 text-emerald-700",
  fechado: "bg-slate-100 text-slate-700",
};
const nomeEstado = {
  aberto: "Recebida",
  em_andamento: "Em análise",
  resolvido: "Resolvida",
  fechado: "Encerrada",
};
export default function Suporte() {
  const [tickets, setTickets] = useState([]);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const carregar = async () => {
    const r = await fetch(`${API_URL}/suporte/tickets`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.erro);
    setTickets(d.tickets || []);
  };
  useEffect(() => {
    carregar()
      .catch(() => setErro("Não foi possível carregar as solicitações de suporte."))
      .finally(() => setCarregando(false));
    const intervalo = window.setInterval(() => carregar().catch(() => {}), 15000);
    const aoFocar = () => carregar().catch(() => {});
    window.addEventListener("focus", aoFocar);
    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", aoFocar);
    };
  }, []);
  const enviar = async (e) => {
    e.preventDefault();
    const formulario = e.currentTarget;
    setErro("");
    setSucesso("");
    setEnviando(true);
    try {
      const r = await fetch(`${API_URL}/suporte/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assunto: formulario.assunto.value,
          mensagem: formulario.mensagem.value,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro);
      formulario.reset();
      setSucesso("Solicitação recebida. A nossa equipa entrará em contacto.");
      await carregar();
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  };
  return (
    <main className="flex-1 overflow-auto bg-slate-50 p-5 md:p-8">
      <header className="flex items-start gap-4">
        <span className="rounded-2xl bg-indigo-100 p-3 text-indigo-600">
          <CircleHelp size={26} />
        </span>
        <div>
          <p className="text-sm font-semibold text-indigo-600">
            CENTRO DE AJUDA
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Suporte</h1>
          <p className="mt-1 text-slate-600">
            Envie uma solicitação e acompanhe o estado por aqui.
          </p>
        </div>
      </header>
      {erro && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">{erro}</p>
      )}
      {sucesso && (
        <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">
          {sucesso}
        </p>
      )}
      <div className="mt-7 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_1.2fr]">
        <form
          onSubmit={enviar}
          className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <MessageSquarePlus className="text-indigo-600" />
            <div>
              <h2 className="font-semibold">Nova solicitação de suporte</h2>
              <p className="text-sm text-slate-500">
                Descreva o problema com o máximo de detalhe.
              </p>
            </div>
          </div>
          <label className="mt-5 block text-sm font-medium">
            Assunto
            <input
              name="assunto"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
              placeholder="Ex.: Não consigo registrar movimento"
              required
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Mensagem
            <textarea
              name="mensagem"
              className="mt-1.5 min-h-36 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500"
              placeholder="Explique o que aconteceu e, se possível, os passos para reproduzir."
              required
            />
          </label>
          <button
            disabled={enviando}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Send size={17} />
            {enviando ? "A enviar..." : "Enviar solicitação"}
          </button>
        </form>
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="font-semibold">As minhas solicitações</h2>
            <p className="text-sm text-slate-500">
              {tickets.length} solicitação(ões) registada(s)
            </p>
          </div>
          {carregando ? (
            <p className="p-6 text-slate-500">A carregar...</p>
          ) : tickets.length ? (
            <div className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {ticket.assunto}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${corEstado[ticket.estado] || corEstado.aberto}`}
                    >
                      {ticket.estado === "resolvido" && <CheckCircle2 size={14} />}
                      {nomeEstado[ticket.estado] || ticket.estado.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {ticket.mensagem}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarClock size={14} aria-hidden="true" />
                    <time dateTime={ticket.created_at}>
                      Enviada em {new Date(ticket.created_at).toLocaleDateString("pt-MZ", { day: "2-digit", month: "long", year: "numeric" })}, às {new Date(ticket.created_at).toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-slate-500">
              Ainda não existem solicitações. Como podemos ajudar?
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

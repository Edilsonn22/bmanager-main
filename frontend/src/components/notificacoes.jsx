import { useEffect, useState } from "react";
import { API_URL as API } from "../api/authenticatedFetch";
export default function Notificacoes() {
  const [itens, setItens] = useState([]); const carregar = () => fetch(`${API}/notificacoes`).then((r) => r.json()).then((d) => setItens(d.notificacoes || []));
  useEffect(() => { carregar(); }, []);
  const ler = async (id) => { await fetch(`${API}/notificacoes/${id}/lida`, { method: "POST" }); carregar(); };
  return <main className="h-dvh min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-7"><h1 className="text-2xl font-bold">Notificações</h1><div className="mt-6 max-w-4xl space-y-3">{itens.map((n) => <article key={n.id} className="min-w-0 rounded-xl border bg-white p-4"><h2 className="break-words font-semibold">{n.titulo}</h2><p className="mt-1 break-words text-gray-600">{n.mensagem}</p>{!n.lida && <button onClick={() => ler(n.id)} className="mt-3 min-h-11 text-sm font-semibold text-indigo-600">Marcar como lida</button>}</article>)}</div></main>;
}

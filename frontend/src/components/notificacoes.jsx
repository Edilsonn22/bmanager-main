import { useEffect, useState } from "react";
import { API_URL as API } from "../api/authenticatedFetch";
export default function Notificacoes() {
  const [itens, setItens] = useState([]); const carregar = () => fetch(`${API}/notificacoes`).then((r) => r.json()).then((d) => setItens(d.notificacoes || []));
  useEffect(() => { carregar(); }, []);
  const ler = async (id) => { await fetch(`${API}/notificacoes/${id}/lida`, { method: "POST" }); carregar(); };
  return <main className="flex-1 overflow-auto p-7"><h1 className="text-2xl font-bold">Notificações</h1><div className="mt-6 space-y-3">{itens.map((n) => <article key={n.id} className="rounded-xl border bg-white p-4"><h2 className="font-semibold">{n.titulo}</h2><p className="mt-1 text-gray-600">{n.mensagem}</p>{!n.lida && <button onClick={() => ler(n.id)} className="mt-3 text-sm text-indigo-600">Marcar como lida</button>}</article>)}</div></main>;
}

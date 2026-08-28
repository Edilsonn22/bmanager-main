import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../api/authenticatedFetch";

export default function EditarCategoria() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", descr: "" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => { (async () => { try {
    const response = await fetch(`${API_URL}/categorias/${id}`); const data = await response.json();
    if (!response.ok) throw new Error(data.erro || "Não foi possível carregar a categoria.");
    setForm({ nome: data.categoria.nome || "", descr: data.categoria.descr || "" });
  } catch (error) { setErro(error.message); } finally { setLoading(false); } })(); }, [id]);
  const guardar = async (event) => { event.preventDefault(); setErro(""); setSalvando(true); try {
    const response = await fetch(`${API_URL}/categorias/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json(); if (!response.ok) throw new Error(data.erro || "Não foi possível atualizar a categoria."); navigate("/categoria");
  } catch (error) { setErro(error.message); } finally { setSalvando(false); } };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><form onSubmit={guardar} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl">
    <div><h2 className="font-bold text-gray-900">Editar categoria</h2><p className="text-sm text-gray-500">Atualize o nome e a descrição.</p></div>
    {erro && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{erro}</p>}
    {loading ? <p className="text-sm text-gray-500">A carregar...</p> : <><label className="block text-sm font-medium">Nome<input className="mt-1 w-full rounded-lg border p-2" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required /></label><label className="block text-sm font-medium">Descrição<textarea className="mt-1 w-full rounded-lg border p-2" rows="3" value={form.descr} onChange={(e) => setForm({ ...form, descr: e.target.value })} required /></label></>}
    <div className="flex gap-3"><button disabled={loading || salvando} className="flex-1 rounded-lg bg-indigo-600 py-2 text-white disabled:opacity-50">{salvando ? "A guardar..." : "Atualizar"}</button><button type="button" onClick={() => navigate("/categoria")} className="flex-1 rounded-lg bg-gray-100 py-2">Cancelar</button></div>
  </form></div>;
}

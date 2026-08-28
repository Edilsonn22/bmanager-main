import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { API_URL } from "../api/authenticatedFetch";

export default function AdicionarFornecedor() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nome: "", email: "", contacto: "", endereco: "" });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const mudar = (campo) => (event) => setForm((atual) => ({ ...atual, [campo]: event.target.value }));
  const guardar = async (event) => { event.preventDefault(); setErro(""); if (!form.nome.trim()) return setErro("Informe o nome do fornecedor."); setSalvando(true); try {
    const response = await fetch(`${API_URL}/fornecedores`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const data = await response.json();
    if (!response.ok) throw new Error(data.erro || "Não foi possível criar o fornecedor."); navigate("/fornecedor", { replace: true });
  } catch (error) { setErro(error.message); } finally { setSalvando(false); } };
  return <FormularioFornecedor titulo="Adicionar fornecedor" subtitulo="Cadastre um novo fornecedor para a sua empresa." form={form} mudar={mudar} erro={erro} salvando={salvando} guardar={guardar} cancelar={() => navigate("/fornecedor")} textoBotao="Guardar fornecedor" />;
}

function FormularioFornecedor({ titulo, subtitulo, form, mudar, erro, salvando, loading = false, guardar, cancelar, textoBotao }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-xl rounded-xl bg-white shadow-xl"><header className="flex items-center justify-between border-b p-6"><div><h2 className="font-bold text-gray-900">{titulo}</h2><p className="text-sm text-gray-500">{subtitulo}</p></div><button type="button" aria-label="Fechar" onClick={cancelar} className="rounded-lg p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button></header><form onSubmit={guardar} className="space-y-4 p-6">
    {erro && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}{loading ? <p className="py-6 text-center text-gray-500">A carregar fornecedor...</p> : <><label className="block text-sm font-medium text-gray-700">Nome *<input value={form.nome} onChange={mudar("nome")} required className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" /></label><label className="block text-sm font-medium text-gray-700">E-mail<input type="email" value={form.email} onChange={mudar("email")} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" /></label><div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-medium text-gray-700">Telefone<input value={form.contacto} onChange={mudar("contacto")} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" /></label><label className="block text-sm font-medium text-gray-700">Endereço<input value={form.endereco} onChange={mudar("endereco")} className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" /></label></div></>}
    <div className="flex gap-3 pt-2"><button disabled={loading || salvando} className="flex-1 rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50">{salvando ? "A guardar..." : textoBotao}</button><button type="button" onClick={cancelar} className="flex-1 rounded-lg bg-gray-100 py-2 text-gray-700 hover:bg-gray-200">Cancelar</button></div>
  </form></div></div>;
}

export { FormularioFornecedor };

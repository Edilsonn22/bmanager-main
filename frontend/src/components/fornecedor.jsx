import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { API_URL } from "../api/authenticatedFetch";

export default function Fornecedor() {
  const { usuario } = useAuth();
  const podeGerir = ["admin", "gestor"].includes(usuario?.role);
  const podeExcluir = usuario?.role === "admin";
  const [fornecedores, setFornecedores] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [removendo, setRemovendo] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const response = await fetch(`${API_URL}/fornecedores`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.erro || "Não foi possível carregar os fornecedores.");
        if (ativo) setFornecedores(data.fornecedores || []);
      } catch (error) {
        if (ativo) setErro(error.message);
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => { ativo = false; };
  }, []);

  const visiveis = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase("pt");
    if (!termo) return fornecedores;
    return fornecedores.filter((fornecedor) =>
      [fornecedor.nome, fornecedor.email, fornecedor.contacto, fornecedor.endereco]
        .some((valor) => valor?.toLocaleLowerCase("pt").includes(termo)),
    );
  }, [fornecedores, pesquisa]);

  const remover = async (fornecedor) => {
    if (!window.confirm(`Excluir o fornecedor “${fornecedor.nome}”?`)) return;
    setErro("");
    setRemovendo(fornecedor.id);
    try {
      const response = await fetch(`${API_URL}/fornecedores/${fornecedor.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || "Não foi possível excluir o fornecedor.");
      setFornecedores((atual) => atual.filter((item) => item.id !== fornecedor.id));
    } catch (error) {
      setErro(error.message);
    } finally {
      setRemovendo(null);
    }
  };

  return <main className="h-screen flex-1 overflow-auto bg-gray-50 p-6 md:p-7">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1><p className="text-gray-600">Gerencie os fornecedores da sua empresa</p></div>
      {podeGerir && <Link to="/adicionarFornecedor" className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"><Plus className="h-5 w-5" />Adicionar</Link>}
    </header>

    {erro && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
    <div className="relative mb-5"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" /><input type="search" placeholder="Pesquisar fornecedor..." value={pesquisa} onChange={(event) => setPesquisa(event.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-indigo-500" /></div>

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto"><table className="w-full min-w-[760px]">
        <thead className="border-b border-gray-200 bg-gray-50"><tr>{["Nome", "E-mail", "Telefone", "Endereço"].map((titulo) => <th key={titulo} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">{titulo}</th>)}{podeGerir && <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">Ações</th>}</tr></thead>
        <tbody className="divide-y divide-gray-200 text-sm">{visiveis.map((fornecedor) => <tr key={fornecedor.id} className="hover:bg-gray-50">
          <td className="px-6 py-3 font-medium text-gray-900">{fornecedor.nome}</td><td className="px-6 py-3 text-gray-600">{fornecedor.email || "—"}</td><td className="px-6 py-3 text-gray-600">{fornecedor.contacto || "—"}</td><td className="px-6 py-3 text-gray-600">{fornecedor.endereco || "—"}</td>
          {podeGerir && <td className="whitespace-nowrap px-6 py-3 text-right"><Link aria-label={`Editar ${fornecedor.nome}`} to={`/editarFornecedor/${fornecedor.id}`} className="inline-flex rounded-lg p-2 hover:bg-gray-100"><Edit2 className="h-4 w-4 text-gray-600" /></Link>{podeExcluir && <button type="button" aria-label={`Excluir ${fornecedor.nome}`} disabled={removendo === fornecedor.id} onClick={() => remover(fornecedor)} className="inline-flex rounded-lg p-2 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4 text-red-600" /></button>}</td>}
        </tr>)}</tbody>
      </table></div>
      {loading && <p className="p-8 text-center text-gray-500">A carregar fornecedores...</p>}
      {!loading && !visiveis.length && <p className="p-8 text-center text-gray-500">{pesquisa ? "Nenhum fornecedor corresponde à pesquisa." : "Nenhum fornecedor cadastrado."}</p>}
    </div>
  </main>;
}

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tags, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { API_URL } from "../api/authenticatedFetch";
import { ConfirmDialog, Feedback } from "./ui/Feedback";

function Categoria() {
  const { usuario } = useAuth();
  const podeGerir = ["admin", "gestor"].includes(usuario?.role);
  const podeExcluir = usuario?.role === "admin";
  const [categorias, setCategorias] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [categoriaExcluir, setCategoriaExcluir] = useState(null);
  const [removendo, setRemovendo] = useState(false);

  // Buscar categorias do backend
  useEffect(() => {
    fetch(`${API_URL}/categorias`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) setCategorias(data.categorias);
        else throw new Error(data.erro || "Não foi possível carregar as categorias.");
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Deletar categoria
  const handleDelete = async () => {
    if (!categoriaExcluir) return;
    setRemovendo(true); setErro(""); setSucesso("");
    try {
      const res = await fetch(`${API_URL}/categorias/${categoriaExcluir.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.sucesso) {
        setCategorias((atuais) => atuais.filter((c) => c.id !== categoriaExcluir.id));
        setSucesso("Categoria excluída com sucesso."); setCategoriaExcluir(null);
      } else {
        throw new Error(data.erro || "Não foi possível excluir a categoria.");
      }
    } catch (error) {
      setErro(error.message);
    } finally { setRemovendo(false); }
  };

  const categoriasFiltradas = categorias.filter((c) =>
    c.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <main className="h-screen min-w-0 flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-7">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-600 mb-">
            Gerencie as categorias do seu negócio
          </p>
        </div>
        {podeGerir && (
          <Link to="/adicionarCategoria">
            <button type="button" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Adicionar categoria
            </button>
          </Link>
        )}
      </div>
      <Feedback tipo="erro" className="mb-4" onClose={() => setErro("")}>{erro}</Feedback><Feedback tipo="sucesso" className="mb-4" onClose={() => setSucesso("")}>{sucesso}</Feedback>

      {/* Pesquisa */}
      <div className="relative mb-5">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          placeholder="Pesquisar categoria..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-center text-xs text-black-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-center text-xs text-black-500 uppercase tracking-wider">
                  Descrição
                </th>
                {podeGerir && (
                  <th className="px-6 py-3 text-center text-xs text-black-500 uppercase tracking-wider">
                    Ações
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 text-center text-xs">
              {categoriasFiltradas.map((categoria) => (
                <tr key={categoria.id}>
                  <td className="px-6 py-3">{categoria.nome}</td>
                  <td className="px-6 py-3">{categoria.descr}</td>
                  <td className="px-6 py-3 text-center">

                    {podeGerir && (
                      <Link to={`/editarCategoria/${categoria.id}`}>
                        <button type="button" aria-label={`Editar ${categoria.nome}`} className="p-2 hover:bg-gray-100 rounded-lg transition">
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </Link>
                    )}
                    {podeExcluir && (
                      <button
                        type="button" aria-label={`Excluir ${categoria.nome}`} onClick={() => setCategoriaExcluir(categoria)}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && <p className="py-8 text-center text-gray-500" role="status">A carregar categorias...</p>}
          {!loading && !erro && categoriasFiltradas.length === 0 && (
            <div className="px-4 py-10 text-center"><Tags className="mx-auto h-10 w-10 text-slate-300"/><p className="mt-3 font-semibold text-slate-700">{pesquisa ? "Nenhuma categoria corresponde à pesquisa." : "Ainda não existem categorias."}</p>{podeGerir && !pesquisa && <Link to="/adicionarCategoria" className="mt-3 inline-flex font-semibold text-indigo-600 hover:underline">Criar a primeira categoria</Link>}</div>
          )}
        </div>
      </div>
      <ConfirmDialog aberto={Boolean(categoriaExcluir)} titulo="Excluir categoria?" descricao={`A categoria “${categoriaExcluir?.nome || ""}” será removida. Produtos associados podem ser afetados.`} ocupada={removendo} onCancelar={() => !removendo && setCategoriaExcluir(null)} onConfirmar={handleDelete}/>
    </main>
  );
}

export default Categoria;

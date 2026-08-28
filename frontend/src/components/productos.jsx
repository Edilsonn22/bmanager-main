import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, X } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { API_URL } from "../api/authenticatedFetch";

function Productos() {
  const { usuario } = useAuth();
  const podeGerir = ["admin", "gestor"].includes(usuario?.role);
  const podeVerPrecoFornecedor = ["admin", "gestor"].includes(usuario?.role);
  const podeVerAcoes = ["admin", "gestor"].includes(usuario?.role);
  const podeExcluir = usuario?.role === "admin";
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");



   const formatarMzn = (valor) => {
    return `${Number(valor || 0).toLocaleString("pt-MZ")}`;
  };

  useEffect(() => {
    fetch(`${API_URL}/produtos`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) setProdutos(data.produtos);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/categorias`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) setCategorias(data.categorias);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/fornecedores`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) setFornecedores(data.fornecedores);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      setProdutos(produtos.filter((p) => Number(p.id) !== Number(id)));

      fetch(`${API_URL}/produtos/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (response.ok) {
            alert("Produto excluído com sucesso!");
          } else {
            alert("Erro ao excluir produto");
          }
        })
        .catch((error) => {
          console.error("Erro ao excluir produto:", error);
          alert("Erro ao excluir produto");
        });
    }
  };

  const GetStatus = (quantidade, estoqueMinimo = 5) => {
    if (quantidade <= estoqueMinimo)
      return { text: "Baixo", class: "bg-red-100 text-red-700" };
    else if (quantidade <= estoqueMinimo * 1.5)
      return { text: "Médio", class: "bg-yellow-100 text-yellow-700" };
    else return { text: "Bom", class: "bg-green-100 text-green-700" };
  };

  const produtosFiltrados = produtos.filter((p) => {
    const correspondeNome = p.nome
      .toLowerCase()
      .includes(pesquisa.toLowerCase());

    const correspondeCategoria =
      categoriaSelecionada === "" ||
      Number(p.idCategoria) === Number(categoriaSelecionada);

    return correspondeNome && correspondeCategoria;
  });

  return (
    <div className="flex-1 h-screen overflow-auto bg-gray-50 p-7 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600 mb-">
            Gerencie os produtos do seu estoque
          </p>
        </div>

        {podeGerir && (
          <Link to="/adicionarProduto">
            <button className="bg-indigo-600 text-white px-2 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
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
              Adicionar
            </button>
          </Link>
        )}
      </div>

      {/* Pesquisa */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        {/* Pesquisa por nome */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Pesquisar produto..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="
        w-full
        rounded-lg
        border
        border-gray-300
        py-2
        pl-4
        pr-4
        outline-none
        focus:border-transparent
        focus:ring-2
        focus:ring-indigo-500
      "
          />
        </div>

        {/* Pesquisa por categoria */}
        <div className="w-full md:w-64">
          <select
            value={categoriaSelecionada}
            onChange={(e) => setCategoriaSelecionada(e.target.value)}
            className="
        w-full
        rounded-lg
        border
        border-gray-300
        bg-white
        px-4
        py-2
        text-gray-700
        outline-none
        focus:border-transparent
        focus:ring-2
        focus:ring-indigo-500
      "
          >
            <option value="" className="text-gray-500">Todas as categorias</option>

            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div></div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Status
                </th>
                {podeVerPrecoFornecedor && (
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                    Preço Fornecedor
                  </th>
                )}
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                  Preço
                </th>
                {podeVerAcoes && (
                  <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">
                    Ações
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 text-center text-xs">
              {produtosFiltrados.map((produto) => {
                const categoria = categorias.find(
                  (c) => Number(c.id) === Number(produto.idCategoria),
                );

                const fornecedor = fornecedores.find(
                  (f) => Number(f.id) === Number(produto.idFornecedor),
                );

                return (
                  <tr key={produto.id}>
                    <td className="px- py-3">{produto.nome}</td>

                    <td className="px-6 py-3">
                      {categoria ? categoria.nome : "Sem categoria"}
                    </td>

                    <td className="px- py-3">
                      {fornecedor ? fornecedor.nome : "Sem fornecedor"}
                    </td>

                    <td className="px-6 py-3">{produto.quantidade}</td>

                    <td className="px-6 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-sm ${GetStatus(produto.quantidade).class}`}
                      >
                        {GetStatus(produto.quantidade).text}
                      </span>
                    </td>
                    {podeVerPrecoFornecedor && (
                      <td className="px-6 py-3">
                        {formatarMzn(produto.precoFornecedor)}
                      </td>
                    )}

                    <td className="px-6 py-3">{formatarMzn(produto.preco)}</td>

                    <td className="px-6 py-3 text-center flex justify-center">
                      {podeGerir && (
                        <Link to={`/editarProduto/${produto.id}`}>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                        </Link>
                      )}

                      {podeExcluir && (
                        <button
                          onClick={() => handleDelete(produto.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {produtosFiltrados.length === 0 && (
            <p className="text-center text-gray-500 py-6">
              Nenhum produto encontrado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Productos;

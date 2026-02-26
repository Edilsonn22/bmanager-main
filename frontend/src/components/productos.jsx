import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deletarProduto } from "../services/api";

function Productos() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [pesquisa, setPesquisa] = useState("");

  // =========================
  // Buscar Produtos
  // =========================
  useEffect(() => {
    fetch("http://localhost:3000/api/produtos")
      .then(res => res.json())
      .then(data => {
        if (data.sucesso) setProdutos(data.produtos);
      })
      .catch(err => console.error(err));
  }, []);

  // =========================
  // Buscar Categorias
  // =========================
  useEffect(() => {
    fetch("http://localhost:3000/api/categorias")
      .then(res => res.json())
      .then(data => {
        if (data.sucesso) setCategorias(data.categorias);
      })
      .catch(err => console.error(err));
  }, []);

  // =========================
  // Buscar Fornecedores
  // =========================
  useEffect(() => {
    fetch("http://localhost:3000/api/fornecedores")
      .then(res => res.json())
      .then(data => {
        if (data.sucesso) setFornecedores(data.fornecedores);
      })
      .catch(err => console.error(err));
  }, []);

  // =========================
  // Delete
  // =========================
  const handleDelete = (id) => {
    if (window.confirm("Tem certeza que deseja excluir este produto?")) {
      setProdutos(produtos.filter((p) => Number(p.id) !== Number(id)));
      alert("Produto excluído com sucesso!");
    }
  };

  // =========================
  // Status Estoque
  // =========================
  const GetStatus = (quantidade, estoqueMinimo = 5) => {
    if (quantidade <= estoqueMinimo)
      return { text: "Baixo", class: "bg-red-100 text-red-700" };
    else if (quantidade <= estoqueMinimo * 1.5)
      return { text: "Médio", class: "bg-yellow-100 text-yellow-700" };
    else
      return { text: "Bom", class: "bg-green-100 text-green-700" };
  };

  // =========================
  // Filtro Pesquisa
  // =========================
  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="flex-1 h-screen overflow-auto bg-gray-50 p-7 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600 mb-">Gerencie os produtos do seu estoque</p>
        </div>
        <Link to="/adicionarProduto">
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
            Adicionar
          </button>
        </Link>
      </div>

      {/* Pesquisa */}
      <div className="relative mb-5">
        <input
          type="text"
          placeholder="Pesquisar produto..."
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
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">Fornecedor</th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">Quantidade</th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">Preço</th>
                <th className="px-6 py-3 text-center text-xs uppercase tracking-wider">Ações</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 text-center text-xs">
              {produtosFiltrados.map((produto) => {

                const categoria = categorias.find(
                  (c) => Number(c.id) === Number(produto.idCategoria)
                );

                const fornecedor = fornecedores.find(
                  (f) => Number(f.id) === Number(produto.idFornecedor)
                );

                return (
                  <tr key={produto.id}>
                    <td className="px-6 py-3">{produto.nome}</td>

                    <td className="px-6 py-3">
                      {categoria ? categoria.nome : "Sem categoria"}
                    </td>

                    <td className="px-6 py-3">
                      {fornecedor ? fornecedor.nome : "Sem fornecedor"}
                    </td>

                    <td className="px-6 py-3">{produto.quantidade}</td>

                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-sm ${GetStatus(produto.quantidade).class}`}>
                        {GetStatus(produto.quantidade).text}
                      </span>
                    </td>

                    <td className="px-6 py-3">{produto.preco}</td>

                    <td className="px-6 py-3 text-center">
                      <Link to={`/editarProduto/${produto.id}`}>
                        <button className="px-2 py-1 inline-flex text-xs font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-700">
                          Editar
                        </button>
                      </Link>

                      <button
                        onClick={() => handleDelete(produto.id)}
                        className="px-2 mx-2 py-1 inline-flex text-xs font-semibold text-white hover:bg-red-700 rounded-lg bg-red-500"
                      >
                        Excluir
                      </button>
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
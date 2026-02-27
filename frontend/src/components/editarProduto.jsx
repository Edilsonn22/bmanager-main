import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function EditarProduto() {
  const navigate = useNavigate();
  const { id } = useParams(); // id do produto pela rota

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [quantidade, setQuantidade] = useState('');

  useEffect(() => {
    // Função para carregar os dados do produto ao montar o componente
    const carregarProduto = async () => {
      const produto = await obterProduto(id);
      if (produto) {
        setNome(produto.nome);
        setCategoria(produto.categoria);
        setPreco(produto.preco);
        setFornecedor(produto.fornecedor);
        setQuantidade(produto.quantidade);
      }
    };

    carregarProduto();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dados = {
      id,
      nome,
      categoria,
      preco,
      fornecedor,
      quantidade,
    };

    const res = await atualizarProduto(dados);

    if (res.sucesso) {
      alert("Produto atualizado com sucesso!");
      navigate(-1);
    } else {
      alert("Erro ao atualizar produto");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-gray-900 font-bold">Editar Produto</h2>
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            type="button"
          >
            ✕
          </button>
        </div>

        <form className="p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols- gap-4">
            <div>
              <label className="block text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Categoria *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
              >
                <option value="">Selecione a Categoria</option>
                {/* Mapear as categorias disponíveis */}
                {/* {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))} */}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Preço *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Fornecedor *</label>
              <select
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
              >
                <option value="">Selecione o Fornecedor</option>
                {/* Mapear os fornecedores disponíveis */}
                {/* {fornecedores.map((forn) => (
                  <option key={forn.id} value={forn.id}>
                    {forn.nome}
                  </option>
                ))} */}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Quantidade *</label>
              <input
                type="number"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Atualizar Produto
            </button>
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition disabled:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarProduto;

{/*import express from 'express';
import pool from './config/db.js'; // Conexão com o banco de dados

const app = express();
app.use(express.json());

// Rota para obter o produto por id
app.get('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [produto] = await pool.query("SELECT * FROM Produto WHERE id = ?", [id]);
    if (produto.length === 0) {
      return res.status(404).json({ sucesso: false, erro: "Produto não encontrado" });
    }
    res.status(200).json({ sucesso: true, produto: produto[0] });
  } catch (error) {
    console.error("Erro ao obter produto:", error);
    res.status(500).json({ sucesso: false, erro: "Erro interno do servidor" });
  }
});*/}


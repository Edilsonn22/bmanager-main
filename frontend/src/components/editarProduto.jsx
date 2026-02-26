import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { atualizarProduto } from '../services/api';

function EditarProduto() {

 const navigate = useNavigate();
  const { id } = useParams(); // id do produto pela rota

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dados = {
      id,
      nome,
      categoria,
      preco,
      fornecedor,
      quantidade,
      estoqueMinimo
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
          <h2 className="text-gray-900 font-bold">Adicionar Novo Produto</h2>
          <button onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg">
            X
          </button>
        </div>

        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            <div>
              <label className="block text-gray-700 mb-2">Nome do Produto *</label>
              <input type="text"
               value= {nome}
                onChange={e => setNome(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Categoria *</label>
              <select
               value={categoria}
                onChange={e => setCategoria(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Selecione a Categoria</option>
                <option value="Eletrônicos">Eletrônicos</option>
                <option value="Roupas">Roupas</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Preço *</label>
              <input
                type="number"
                step="0.01"
               value={preco}
                onChange={e => setPreco(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Fornecedor *</label>
              <select
                value={fornecedor}
                onChange={e => setFornecedor(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Selecione o Fornecedor</option>
                <option value="Fornecedor A">Fornecedor A</option>
                <option value="Fornecedor B">Fornecedor B</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Quantidade *</label>
              <input
                type="number"
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Estoque Mínimo *</label>
              <input
                type="number"
                value={estoqueMinimo}
                onChange={e => setEstoqueMinimo(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

      

          <div className="flex gap-3 mt-6">
          <form className="p-6" onSubmit={handleSubmit}>
          <button type="submit">Salvar Alterações</button>
        </form>
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
          </div>
        
      </div>
    </div>
  );
}

export default EditarProduto;
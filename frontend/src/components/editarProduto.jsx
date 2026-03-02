import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function EditarProduto() {
  const navigate = useNavigate();
  const { id } = useParams();

  // States do formulário
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [preco, setPreco] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [quantidade, setQuantidade] = useState('');

  // Para popular selects
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar produto
  const obterProduto = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/produtos/${id}`);
      const data = await res.json();
      if (data.sucesso) return data.produto;
      else {
        alert("Produto não encontrado");
        return null;
      }
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      return null;
    }
  };

  // Função para atualizar produto (CORRIGIDA: agora recebe id e dados)
  const atualizarProduto = async (id, dados) => {
    try {
      const res = await fetch(`http://localhost:3000/api/produtos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });
      return await res.json();
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      return { sucesso: false };
    }
  };

  // Carregar categorias e fornecedores
  useEffect(() => {
    fetch("http://localhost:3000/api/categorias")
      .then(res => res.json())
      .then(data => { if (data.sucesso) setCategorias(data.categorias); })
      .catch(err => console.error(err));

    fetch("http://localhost:3000/api/fornecedores")
      .then(res => res.json())
      .then(data => { if (data.sucesso) setFornecedores(data.fornecedores); })
      .catch(err => console.error(err));
  }, []);

  // Carregar produto
  useEffect(() => {
    const carregarProduto = async () => {
      const produto = await obterProduto(id);
      if (produto) {
        setNome(produto.nome);
        // Ajuste aqui: use os nomes que vêm do seu banco (ex: idCategoria ou categoria_id)
        setCategoria(produto.idCategoria?.toString() || ''); 
        setPreco(produto.preco?.toString() || '');
        setFornecedor(produto.idFornecedor?.toString() || '');
        setQuantidade(produto.quantidade?.toString() || '');
      }
      setLoading(false);
    };
    carregarProduto();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Objeto formatado para o seu Controller do Backend
    const dados = {
      nome: nome || null,
      idCategoria: categoria ? Number(categoria) : null,
      preco: preco ? Number(preco) : null,
      idFornecedor: fornecedor ? Number(fornecedor) : null,
      quantidade: quantidade ? Number(quantidade) : null,
    };

    const res = await atualizarProduto(id, dados);

    if (res.sucesso) {
      alert("Produto atualizado com sucesso!");
      navigate(-1);
    } else {
      alert("Erro ao atualizar produto: " + (res.erro || "Erro desconhecido"));
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-400 bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg">Carregando produto...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-gray-900 font-bold">Editar Produto</h2>
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg" type="button">✕</button>
        </div>

        <form className="p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">

            <div>
              <label className="block text-gray-700 mb-2">Nome do Produto *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Categoria *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Selecione a Categoria</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Fornecedor *</label>
              <select
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Selecione o Fornecedor</option>
                {fornecedores.map(forn => (
                  <option key={forn.id} value={forn.id}>{forn.nome}</option>
                ))}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

          </div>

          <div className="flex gap-3 mt-6">
            <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">
              Atualizar Produto
            </button>
            <button onClick={() => navigate(-1)} type="button" className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarProduto;

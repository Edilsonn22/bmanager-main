import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function AdicionarProduto() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [idCategoria, setIdCategoria] = useState(""); 
  const [preco, setPreco] = useState("");
  const [idFornecedor, setIdFornecedor] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);


useEffect(() => {
    fetch("http://localhost:3000/api/categorias")
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setCategorias(data.categorias);
        } else {
          console.error(data.erro);
        }
      })
      .catch((err) => console.error("Erro ao carregar categorias:", err));
  }, []);

 
  useEffect(() => {
    fetch("http://localhost:3000/api/fornecedores")
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setFornecedores(data.fornecedores);
        } else {
          console.error(data.erro);
        }
      })
      .catch((err) => console.error("Erro ao carregar fornecedores:", err));
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem("");

    if (!idCategoria) {
      setMensagem("Por favor, selecione uma categoria!");
      return;
    }

    if (!idFornecedor) {
      setMensagem("Por favor, selecione um fornecedor!");
      return;
    }

    if (parseFloat(preco) <= 0) {
      setMensagem("O preço deve ser maior que zero!");
      return;
    }

    if (parseInt(quantidade) < 0) {
      setMensagem("A quantidade não pode ser negativa!");
      return;
    }

  const dados = {
  nome,
  idCategoria: parseInt(idCategoria),
  preco: parseFloat(preco),
  idFornecedor: parseInt(idFornecedor),
  quantidade: parseInt(quantidade),
};

    console.log("Enviando dados:", dados);


    try {
      const response = await fetch(
        "http://localhost:3000/api/produtos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dados),
        }
      );

      const result = await response.json();
      console.log("Resposta do servidor:", result);

      if (result.sucesso) {
        setMensagem("✓ Produto adicionado com sucesso!");

        // Limpar formulário
        setNome("");
        setIdCategoria("");
        setPreco("");
        setIdFornecedor("");
        setQuantidade("");

        setTimeout(() => {
            navigate(-1);
        }, 1500);
      } else {
        setMensagem("Erro: " + result.erro);
      }
    } catch (error) {
      console.error("Erro completo:", error);
      setMensagem("Erro ao adicionar produto: " + error.message);
    }
      
  };

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-gray-900 font-bold">Adicionar Novo Produto</h2>
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
                value={idCategoria}
                onChange={(e) => setIdCategoria(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
              >
                <option value="">Selecione a Categoria</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Fornecedor *</label>
              <select
                value={idFornecedor}
                onChange={(e) => setIdFornecedor(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
              >
                <option value="">Selecione o Fornecedor</option>
                {fornecedores.map((forn) => (
                  <option key={forn.id} value={forn.id}>
                    {forn.nome}
                  </option>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:bg-gray-100"
              />
            </div>
          </div>

          {mensagem && (
            <p
              className={`mt-4 font-medium ${
                mensagem.includes("sucesso") || mensagem.includes("✓")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {mensagem}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >Adicionar Produto
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

export default AdicionarProduto;
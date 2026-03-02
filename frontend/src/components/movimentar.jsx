import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function RegistarMovimento() {
  const navigate = useNavigate();

  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [tipoMovimento, setTipoMovimento] = useState("");

  const tipos = ["entrada", "saida"];

  // Carregar produtos do backend
  useEffect(() => {
    fetch("http://localhost:3000/api/produtos")
      .then((res) => res.json())
      .then((data) => {
        if (data.sucesso) {
          setProdutos(data.produtos);
        } else {
          console.error("Erro ao carregar produtos:", data.erro);
        }
      })
      .catch((err) => console.error("Erro ao carregar produtos:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!produtoSelecionado) {
      alert("Selecione um produto!");
      return;
    }

    if (!tipoMovimento) {
      alert("Selecione o tipo de movimento!");
      return;
    }

    if (!quantidade || Number(quantidade) <= 0) {
      alert("Digite uma quantidade válida!");
      return;
    }

    const produto = produtos.find((p) => p.id === Number(produtoSelecionado));
    if (!produto) {
      alert("Produto selecionado inválido!");
      return;
    }

    if (tipoMovimento === "saida" && Number(quantidade) > produto.quantidade) {
      alert("Quantidade maior que o estoque disponível!");
      return;
    }

    try {
      const resposta = await fetch("http://localhost:3000/api/movimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_Produto: Number(produto.id),                  
          tipo: tipoMovimento.toLowerCase(),       
          quantidade: Number(quantidade),  
        }),
      });

      const data = await resposta.json();

      if (data.sucesso) {
        alert(`${tipoMovimento} registrada com sucesso!`);
        navigate(-1);
      } else {
        alert("Erro ao registrar movimento: " + (data.erro || "Erro desconhecido"));
      }
    } catch (err) {
      console.error("Erro ao registrar movimento:", err);
      alert("Erro ao registrar movimento: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-gray-900 font-bold text-center">Registrar Movimento</h2>
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            X
          </button>
        </div>

        <form className="p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            {/* Produto */}
            <div>
              <label className="block text-gray-700 mb-2">Produto:</label>
              <select
                value={produtoSelecionado}
                onChange={(e) => setProdutoSelecionado(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Selecione o Produto</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (Disponível: {p.quantidade})
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de movimento */}
            <div>
              <label className="block text-gray-700 mb-2">Tipo de Movimento:</label>
              <select
                value={tipoMovimento}
                onChange={(e) => setTipoMovimento(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">Selecione o tipo</option>
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-gray-700 mb-2">Quantidade:</label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                min="1"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Registrar
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistarMovimento;
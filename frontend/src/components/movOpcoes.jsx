import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { adicionarMovimento } from "../api/api"; // Ajusta o caminho

function MovOpcoes() {
  const navigate = useNavigate();

  const [mensagem, setMensagem] = useState("");

  const opcoes = ["Entrada", "Saída"];
  const [tipoMovimento, setTipoMovimento] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tipoMovimento) {
      alert("Selecione um tipo de movimentação!");
      return;
    }

    // const resposta = await adicionarMovimento({ tipoMovimento });

    // Simulação
    const resposta = { sucesso: true };

    if (resposta.sucesso) {
      setMensagem("Movimentação adicionada com sucesso!");
      setTipoMovimento(opcoes[0]);
    } else {
      setMensagem(resposta.erro || "Erro ao adicionar movimentação");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4  border-gray-200 flex items-center justify-between">
          <h2 className="text-gray-900 font-bold">Tipo de Movimentação:</h2>

          {/*<button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            X
          </button>*/}
        </div>

        <form className="p-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols">
            
            <div>
              <select className="w-full px- py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                value={tipoMovimento}
                onChange={(e) => {
                    const opcaoSelecionada = e.target.value;
                    setTipoMovimento(opcaoSelecionada);

                    if(opcaoSelecionada === "Entrada") {
                        navigate("/registarEntrada");
                    } else if (opcaoSelecionada === "Saída") {
                        navigate("/registarSaida");
                    }
                    
                
                }}
                
              >
                <option value="">Selecione a operação</option>

                {opcoes.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            </div>
          </div>

          

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              Voltar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MovOpcoes;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function RegistarEntrada() {
    const navigate = useNavigate();

    const [produtos, setProdutos] = useState([]); // lista
    const [produtoSelecionado, setProdutoSelecionado] = useState(""); // selecionado
    const [quantidade, setQuantidade] = useState("");

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
            .catch((err) => {
                console.error("Erro ao carregar produtos:", err);
            });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (quantidade < 0) {
            alert("A quantidade deve ser um número positivo!");
            return;
        }
        if (produtoSelecionado && quantidade) {
            fetch("http://localhost:3000/api/produtos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    produto_id: produtoSelecionado,
                    quantidade: quantidade,
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.sucesso) {
                        alert("Entrada registrada com sucesso!");
                        navigate(-1);
                    } else {
                        alert("Erro ao registrar entrada: " + data.erro);
                    }
                })
                .catch((err) => {
                    console.error("Erro ao registrar entrada:", err);
                    alert("Erro ao registrar entrada.");
                });
        } else {
            alert("Por favor, selecione um produto e informe a quantidade.");
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full overflow-y-auto">
                
                <div className=" flex items-center justify-between">
                    <h2 className="text-gray-900 font-bold text-center ml-6 mt-6">
                        Registrar Entrada
                    </h2>

                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg mr-6 mt-6"
                    >
                        X
                    </button>
                </div>

                <form className="p-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4">
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
                                        {p.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Quantidade:</label>

                            <input
                                type="number"
                                value={quantidade}
                                onChange={(e) => setQuantidade(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                name="quantidade"
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                                >
                                    Registar
                                </button>
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
                </form>
            </div>
        </div>
    );
}

export default RegistarEntrada;

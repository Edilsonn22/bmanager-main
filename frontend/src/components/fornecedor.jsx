import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Fornecedor() {
    const [fornecedores, setFornecedores] = useState([]);

        useEffect(() => {
          fetch("http://localhost:3000/api/fornecedores")
            .then((res) => res.json())
            .then((data) => {
              if (data.sucesso) setFornecedores(data.fornecedores);
              else console.error(data.erro);
            })
            .catch((err) => console.error("Erro ao carregar fornecedores:", err));
        }, []);

    const handleDelete = (id) => {
        if (window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
            alert("Fornecedor excluído com sucesso!");
        }
    };

    return (
        <div className="flex-1 h-screen overflow-auto bg-gray-50 p-7 py-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
                    <p className="text-gray-600 mb-">Gerencie os fornecedores do seu negócio</p>
                </div>
                <Link to="/adicionarFornecedor">
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2">
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
            </div>
            <div className="bg- mb-5">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
                    <div className="relative mb-5 ">
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
                            placeholder="Pesquisar fornecedor..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-center text-xs text-black-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-center text-xs text-black-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs text-black-500 uppercase tracking-wider">
                                        Telefone
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs text-black-500 uppercase tracking-wider">
                                        Endereco
                                    </th>

                                    <th className="px-6 py-3 text-center text-xs text-black-500 uppercase tracking-wider ">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200 text-center text-xs">
                                {fornecedores.map((fornecedor) => (
                                    <tr key={fornecedor.id}>
                                        <td className="px-6 py-3">{fornecedor. nome}</td>
                                        <td className="px-6 py-3">{fornecedor.email}</td>
                                        <td className="px-6 py-3">{fornecedor.contacto}</td>
                                        <td className="px-6 py-3">{fornecedor.endereco}</td>


                                        <td className="px-6 py-3 text-center">
                                            <Link to={`/editarFornecedor/${fornecedor.id}`}>
                                                <button className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-700">
                                                    Editar
                                                </button>
                                            </Link>

                                            <button
                                                onClick={() => handleDelete(fornecedor.id)}
                                                className="px-2 mx-2 py-1  inline-flex text-xs leading-5 font-semibold text-white hover:bg-red-700 rounded-lg bg-red-500 "
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Se não tiver produtos */}
                        {fornecedores.length === 0 && (
                            <p className="text-center text-gray-500 py-6">
                                Nenhum fornecedor encontrado.
                            </p>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
export default Fornecedor;
import { useState, useEffect } from "react";

function Movimentos() {
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovimentos = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/movimentos");
        const data = await res.json();
        if (data.sucesso) setMovimentos(data.movimentos);
      } catch (error) {
        console.error("Erro ao carregar movimentos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovimentos();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center">
        Carregando movimentos...
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen p-7 py-6 bg-gray-50">
      <div className="mb-9">
        <h1 className="text-2xl font-bold text-gray-900">Movimentos</h1>
        <p className="text-gray-600">Veja os movimentos do Estoque</p>
      </div>

      <div className="p-3 border-gray-200 border-b -mt-11 mb-5"></div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-bold text-black-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-black-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-black-500 uppercase tracking-wider">
                  Quantidade
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-black-500 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200 text-center">
              {movimentos.length > 0 ? (
                movimentos.map((mov) => (
                  <tr key={mov.id} className="bg-white">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mov.nomeProduto}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${mov.tipo === "entrada"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                          }`}
                      >
                        {mov.tipo === "entrada" ? "Entrada" : "Saída"} {/* capitalização correta */}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                      {mov.quantidade}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(mov.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    Nenhuma movimentação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Movimentos;
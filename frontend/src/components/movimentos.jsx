import { useState, useEffect } from "react";
import { API_URL } from "../api/authenticatedFetch";
import { Link } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";
import { Feedback } from "./ui/Feedback";

function Movimentos() {
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const fetchMovimentos = async () => {
      try {
        const res = await fetch(`${API_URL}/movimentos`);
        const data = await res.json();
        if (!res.ok || !data.sucesso) throw new Error(data.erro || "Não foi possível carregar os movimentos.");
        setMovimentos(data.movimentos || []);
      } catch (error) {
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMovimentos();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center">
        <span role="status">A carregar movimentos...</span>
      </div>
    );
  }

  return (
    <main className="h-screen min-w-0 flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-7">
      <div className="mb-9">
        <h1 className="text-2xl font-bold text-gray-900">Movimentos</h1>
        <p className="text-gray-600">Consulte todas as entradas e saídas de stock</p>
      </div>

      <div className="p-3 border-gray-200 border-b -mt-11 mb-5"></div>
      <Feedback tipo="erro" className="mb-4">{erro}</Feedback>

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
                <th>Origem</th><th>Motivo</th>
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
                      {new Date(mov.created_at).toLocaleDateString("pt-MZ")}
                    </td>
                    <td className="capitalize">{mov.origem || "manual"}</td><td>{mov.motivo || "—"}{mov.venda_id&&<> · <a className="text-indigo-600" href={`/vendas/${mov.venda_id}`}>Venda #{mov.venda_id}</a></>}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    <ArrowLeftRight className="mx-auto mb-2 h-8 w-8 text-slate-300"/><span className="block font-semibold text-slate-700">Ainda não existem movimentos.</span><Link to="/movimentar" className="mt-2 inline-flex font-semibold text-indigo-600 hover:underline">Registar o primeiro movimento</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default Movimentos;



function Movimentos() {
  const movimentos = [
    { id: 1, produto: "Produto A", tipo: "Entrada", quantidade: 50, data: "2024-02-07" },
    { id: 2, produto: "Produto B", tipo: "Saída", quantidade: 20, data: "2024-02-06" },
  ];

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

            <tbody className="bg-white divide-y divide-gray-200">
              {movimentos.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-50 text-center">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mov.produto}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      mov.tipo === 'Entrada' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {mov.quantidade}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(mov.data).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Movimentos;
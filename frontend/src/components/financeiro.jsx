import { useState } from "react";
import { Link } from "react-router-dom";

import {
  DollarSign,
  TrendingUp,
  Wallet,
} from "lucide-react";

function Financeiro() {
  const defaultStats = [
    {
      label: "Receita de Vendas",
      value: "0 Mzn",
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Custo dos Produtos Vendidos",
      value: "0 Mzn",
      icon: DollarSign,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Lucro Bruto",
      value: "0 Mzn",
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "Lucro Líquido",
      value: "0 Mzn",
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
  ];

  const [stats] = useState(defaultStats);

  return (
    <div className="flex-1 h-screen overflow-auto p-7 py-6 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Gestão Financeira</h2>
          <p className="text-gray-700 text-xl">
            Gerencie as finanças do seu negócio!
          </p>
        </div>

        <Link to="/movimentar">
          <button className="bg-black text-white px-2 py-2 rounded-lg hover:bg-black/50 transition flex items-center gap-2">
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
            Movimentar
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-4 rounded-md shadow-sm flex flex-col items-center"
          >
            <div
              className={`w-12 h-12 ${stat.bg} flex items-center justify-center rounded-lg mb-2`}
            >
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-lg font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-md p-5 text-gray-900 mb-7">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Demostracao de Resultado</h3>
          <div>
            <p className="text-gray-500 text-md mb-7 ">Analise Financeira Detalhada</p>
          </div>

          <div className="bg-green-100 rounded-xl p-4 mb-5">
            <h2>Receitas de Vendas </h2>
          </div>

          <div className="bg-orange-100 rounded-xl p-4 mb-5">
            <h2>Custo dos Produtos Vendidos</h2>
          </div>

          <div className="bg-green-100 rounded-xl p-4 mb-5">
            <h2>Lucro Bruto</h2>
          </div>

          <div className="bg-red-100 rounded-xl p-4 mb-5">
            <h2>Despesas Operacionais</h2>
          </div>

          <div className="bg-blue-100 rounded-xl p-4 font-bold">
            <h2>Lucro Liquido</h2>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md p-5">
        <h2 className="font-semibold text-gray-900 mb-1">Transacoes</h2>
        <p className="text-gray-500  mb-7 ">Visualizar e gerir todas as transacoes financeiras</p>

        <div  className=" bg-white border-gray-200 overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Descricao</th>
                  <th>Valor</th>
                  <th>Acoes</th>
                </tr>
              </thead>
            </table>
          </div>
        </div>


      </div>
    </div>
  );
}

export default Financeiro;
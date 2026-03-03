import { useState } from "react";
import { Link } from "react-router-dom";

import {
  DollarSign,
  TrendingDown,
  Wallet,
} from "lucide-react";

function Financeiro() {
  const defaultStats = [
    {
      label: "Saldo total",
      value: "0 Mzn",
      icon: Wallet,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Valor do Estoque",
      value: "0 Mzn",
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-50",
    },
 
    {
      label: "Despesas",
      value: "0 produtos",
      icon: TrendingDown,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
  ];

  const [stats] = useState(defaultStats);

  return (
    <div className="flex-1 min-h-screen overflow-auto p-7 py-6 bg-gray-50">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Gestão Financeira</h2>
          <p className="text-gray-600">
            Faça a gestão financeira do seu negócio!
          </p>
        </div>

        <Link to="/movimentar">
          <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-black/80 transition flex items-center gap-2">
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


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="bg-white p-5 rounded-xl shadow-sm  hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                  <h3 className="text-xl font-bold mt-1">{stat.value}</h3>
                </div>

                <div
                  className={`p-3 rounded-lg ${stat.bg}`}
                >
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Financeiro;
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

function Dashboard() {

  const defaultStats = [
    { label: 'Total Produtos', value: '0', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Valor do Estoque', value: '0 Mzn', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Entradas', value: '0 unidades', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Saida', value: '0 produtos', icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const [produtos, setProdutos] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [stats, setStats] = useState(defaultStats);
  const [recentMovements, setRecentMovements] = useState([]);


  useEffect(() => {
    fetch("http://localhost:3000/api/produtos")
      .then(res => res.json())
      .then(data => {
        if (data.sucesso) {
          setProdutos(data.produtos);


          const lowStock = data.produtos
            .filter(p => Number(p.quantidade) < 5)
            .map(p => ({
              name: p.nome,
              current: p.quantidade,
              minimum: p.estoqueMinimo
            }));

          setLowStockItems(lowStock);

          const totalProdutos = data.produtos.length;

          const valorEstoque = data.produtos.reduce(
            (acc, p) => acc + Number(p.preco) * Number(p.quantidade),
            0
          );

          setStats([
            { label: 'Total Produtos', value: totalProdutos, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Valor do Estoque', value: `${valorEstoque.toFixed(2)} Mzn`, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Entradas', value: `${data.produtos.length} unidades`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Saida', value: `${lowStock.length} produtos`, icon: TrendingDown, color: 'text-orange-500', bg: 'bg-orange-50' },
          ]);
          

          setRecentMovements(data.produtos.slice(0, 5).map(p => ({
            name: p.nome,
            action: `Quantidade: ${p.quantidade}`,
            date: new Date().toLocaleDateString(),
            icon: Number(p.quantidade) > Number(p.estoqueMinimo) ? TrendingDown : TrendingUp,
            color: Number(p.quantidade) > Number(p.estoqueMinimo) ? 'text-emerald-500' : 'text-emerald-500',
            bg: Number(p.quantidade) > Number(p.estoqueMinimo) ? 'bg-emerald-50' : 'bg-emerald-50'
          })));

        } else {
          console.error(data.erro);
        }
      })
      .catch(err => console.error("Erro:", err));
  }, []);

  return (
    <div className="flex-1 h-screen overflow-auto p-7 py-6 bg-gray-50">
      <div className='flex items-center justify-between mb-8 '>
        <div>
          <h2 className="text-2xl font-bold ">Dashboard Overview</h2>
          <p className="text-gray-700 text-xl mb-">
            Welcome back to your Business Manager Dashboard!
          </p>
        </div>
        <Link to="/movimentar">
          <button className="bg-green-600 text-white px-2 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
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





      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7 mb-10">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white p-4 rounded-md shadow-sm flex flex-col items-center">
            <div className={`w-12 h-12 ${stat.bg} flex items-center justify-center rounded-lg mb-2`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-lg font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Low Stock */}
      <div className="bg-white p-5 rounded-md mb-8">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="font-semibold text-gray-900">Alerta de Estoque Baixo</h3>
          </div>
        </div>

        {lowStockItems.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum produto com estoque baixo.</p>
        ) : (
          lowStockItems.map(item => (
            <div key={item.name} className="bg-red-50 w-full rounded-2xl px-4 py-3 mb-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Atual: {item.current} | Mínimo: {item.minimum}
                  </p>
                </div>

                <span className="bg-red-500 text-white text-xs font-semibold px-3 py-3 rounded-full">
                  Estoque baixo
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Movements */}
      <div className="bg-white p-5 rounded-md">
        <h3 className="font-semibold text-gray-900 mb-2">
          Movimentos de Estoque Recente
        </h3>

        {recentMovements.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum movimento recente.</p>
        ) : (
          recentMovements.map(item => (
            <div key={item.name} className="flex justify-between px-4 py-3 mb-">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 ${item.bg} flex items-center justify-center rounded-md`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.action}</p>
                </div>
              </div>
              <span className="text-sm text-gray-700">{item.date}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Dashboard;

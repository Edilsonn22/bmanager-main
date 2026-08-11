import { NavLink } from "react-router-dom";

import { Package, BarChart3, ArrowLeftRight, Wallet, Users, Tags, ChartColumn, LogOut } from "lucide-react";


const menuItems = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "productos", label: "Produtos", icon: Package },
  { id: "movimentos", label: "Movimentos", icon: ArrowLeftRight },
  {id: "financeiro", label: "Financeiros", icon: Wallet},
  { id: "fornecedor", label: "Fornecedores", icon: Users },
  { id: "categoria", label: "Categorias", icon: Tags },
  { id: "relatorios", label: "Relatórios", icon: ChartColumn },
];

function Navbar() {


  return (
    <div className="flex-shrink-0 w-64 bg-blue-300 shadow-2 p-4 flex flex-col rounded-r-4xl">
      <h1 className="font-bold text-lg -mb-4 py-2">BusinessPro</h1>
      <h3 className="font-bold text-lg">Vendas</h3>

      <div className="p-3 border-b border-blue-400"></div>

      <nav className="py-3">
        {menuItems.map(item => (
          <NavLink
            key={item.id}
            to={item.id === "overview" ? "/" : `/${item.id.toLowerCase()}`}
            className={({ isActive }) =>
              `w-full flex items-center gap-2 px-3 py-3 rounded-md mb-2 transition-colors ${isActive
                ? "bg-blue-400 text-blue-600"
                : "text-gray-700  hover:bg-blue-300"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="mt-auto flex items-center gap-2 text-red-600 hover:bg-red-50 px-3 py-2 rounded-md">
        <LogOut className="w-6 h-5" />
        Logout
      </button>
    </div>
  );
}

export default Navbar;

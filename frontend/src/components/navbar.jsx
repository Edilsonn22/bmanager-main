import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  BarChart3,
  Banknote,
  ChartColumn,
  CircleUserRound,
  CreditCard,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  Tags,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { podeAceder } from "../features/access/permissions";
import vendaiLogo from "../assets/vendai-logo.png";

const grupos = [
  {
    titulo: "VISÃO GERAL",
    itens: [
      { id: "painel", label: "Painel", icon: BarChart3, modulo: "estoque" },
      { id: "assinatura", label: "Plano e assinatura", icon: CreditCard },
    ],
  },
  {
    titulo: "VENDAS",
    itens: [
      {
        id: "vendas/nova",
        label: "Nova venda",
        icon: ShoppingCart,
        modulo: "estoque",
      },
      {
        id: "vendas",
        label: "Histórico de vendas",
        icon: ReceiptText,
        modulo: "estoque",
        end: true,
      },
      { id: "clientes", label: "Clientes", icon: Users, modulo: "estoque" },
      { id: "caixa", label: "Caixa", icon: Banknote, modulo: "estoque" },
    ],
  },
  {
    titulo: "OPERAÇÃO",
    itens: [
      { id: "productos", label: "Produtos", icon: Package, modulo: "estoque" },
      {
        id: "movimentos",
        label: "Movimentos",
        icon: ArrowLeftRight,
        modulo: "estoque",
      },
      {
        id: "fornecedor",
        label: "Fornecedores",
        icon: Users,
        modulo: "estoque",
      },
      { id: "categoria", label: "Categorias", icon: Tags, modulo: "estoque" },
    ],
  },
  {
    titulo: "ANÁLISE",
    itens: [
      {
        id: "financeiro",
        label: "Financeiro",
        icon: Wallet,
        modulo: "financeiro",
      },
      {
        id: "relatorios",
        label: "Relatórios",
        icon: ChartColumn,
        modulo: "relatorios",
      },
      {
        id: "usuarios",
        label: "Utilizadores",
        icon: UserCog,
        modulo: "administracao",
      },
    ],
  },
  {
    titulo: "CONTA",
    itens: [
      { id: "perfil", label: "Perfil e empresa", icon: CircleUserRound },
      { id: "suporte", label: "Suporte", icon: LifeBuoy },
    ],
  },
];

export default function Navbar() {
  const { usuario, terminarSessao } = useAuth();
  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const destino = (id) =>
    id === "painel" ? "/painel" : id === "productos" ? "/produtos" : `/${id}`;
  const logout = () => {
    terminarSessao();
    navigate("/login", { replace: true });
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir navegação"
        className="fixed left-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg md:hidden"
      >
        <Menu size={22} />
      </button>
      {aberto && (
        <button
          type="button"
          aria-label="Fechar navegação"
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-300 md:relative md:z-auto md:translate-x-0 md:shadow-none ${aberto ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex min-h-14 items-center justify-between border-b border-slate-100 px-2 pb-5">
          <NavLink
            to="/painel"
            aria-label="Vendai — painel"
            className="flex min-w-0 items-center"
            onClick={() => setAberto(false)}
          >
            <img
              src={vendaiLogo}
              alt="Vendai"
              className="h-9 w-auto max-w-32 object-contain"
            />
          </NavLink>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setAberto(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-5 flex-1 overflow-y-auto pr-1">
          {grupos.map((grupo) => {
            const itens = grupo.itens.filter(
              (item) => !item.modulo || podeAceder(usuario?.role, item.modulo),
            );
            if (!itens.length) return null;
            return (
              <section key={grupo.titulo} className="mb-5">
                <p className="mb-2 px-3 text-[11px] font-bold tracking-wider text-slate-400">
                  {grupo.titulo}
                </p>
                <div className="space-y-1">
                  {itens.map((item) => (
                    <NavLink
                      key={item.id}
                      to={destino(item.id)}
                      end={item.end}
                      onClick={() => setAberto(false)}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
                      }
                    >
                      <item.icon size={19} className="shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </section>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event("vendai:start-onboarding"));
              setAberto(false);
            }}
            className="mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
          >
            <Sparkles size={18} />
            Ver guia do sistema
          </button>
          <NavLink
            to="/perfil"
            onClick={() => setAberto(false)}
            className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
              {usuario?.nome?.charAt(0).toUpperCase() || "U"}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm text-slate-800">
                {usuario?.nome || "Utilizador"}
              </strong>
              <small className="block capitalize text-slate-500">
                {usuario?.role || "Sem perfil"}
              </small>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <LogOut size={19} />
            Terminar sessão
          </button>
        </div>
      </aside>
    </>
  );
}

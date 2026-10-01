import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  BarChart3,
  Banknote,
  BookOpen,
  ChartColumn,
  ChevronDown,
  CircleUserRound,
  CreditCard,
  FolderClosed,
  FolderOpen,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  ShoppingCart,
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

const destinoItem = (id) =>
  id === "painel" ? "/painel" : id === "productos" ? "/produtos" : `/${id}`;

export default function Navbar() {
  const { usuario, terminarSessao } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [aberto, setAberto] = useState(false);
  const [grupoManual, setGrupoManual] = useState(null);
  const [comprimido, setComprimido] = useState(() => {
    try {
      return localStorage.getItem("vendai.sidebarComprimido") === "true";
    } catch {
      return false;
    }
  });

  const alternarSidebar = () => {
    setComprimido((valorAtual) => {
      const novoValor = !valorAtual;
      try {
        localStorage.setItem("vendai.sidebarComprimido", String(novoValor));
      } catch {
        // Mantém o controlo funcional quando o armazenamento não está disponível.
      }
      return novoValor;
    });
  };

  const grupoDaRota = grupos.findIndex((grupo) =>
    grupo.itens.some((item) => {
      const rota = destinoItem(item.id);
      return item.end
        ? location.pathname === rota
        : location.pathname.startsWith(rota);
    }),
  );
  const grupoAberto = grupoManual ?? (grupoDaRota >= 0 ? grupoDaRota : 0);

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
        className={`fixed inset-y-0 left-0 z-50 flex w-[268px] shrink-0 flex-col border-r border-slate-200 bg-white p-3 shadow-2xl transition-[width,transform,padding] duration-300 ease-out md:relative md:z-20 md:translate-x-0 md:shadow-none ${
          aberto ? "translate-x-0" : "-translate-x-full"
        } ${comprimido ? "md:w-[76px] md:p-2" : "md:w-[235px]"}`}
      >
        <div
          className={`flex min-h-14 items-center justify-between gap-2 border-b border-slate-100 px-2 pb-3 ${comprimido ? "md:gap-1 md:px-0" : ""}`}
        >
          <NavLink
            to="/painel"
            aria-label="Vendaí — painel"
            className="flex min-w-0 items-center"
            onClick={() => setAberto(false)}
          >
            <img
              src={vendaiLogo}
              alt="Vendaí"
              className={`h-9 w-auto max-w-32 object-contain ${comprimido ? "md:hidden" : ""}`}
            />
            {comprimido && (
              <span className="hidden h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 text-sm font-black text-white shadow-sm shadow-indigo-200 md:grid">
                V
              </span>
            )}
          </NavLink>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={alternarSidebar}
              title={comprimido ? "Expandir menu" : "Comprimir menu"}
              aria-label={
                comprimido ? "Expandir menu lateral" : "Comprimir menu lateral"
              }
              aria-expanded={!comprimido}
              className={`hidden place-items-center rounded-md border border-transparent text-slate-400 transition hover:border-slate-200 hover:bg-slate-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 md:grid ${comprimido ? "h-6 w-6" : "h-8 w-8"}`}
            >
              {comprimido ? (
                <PanelLeftOpen size={15} />
              ) : (
                <PanelLeftClose size={17} />
              )}
            </button>

            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setAberto(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav
          className={`mt-3 min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${comprimido ? "md:px-1" : "pr-1"}`}
        >
          {grupos.map((grupo, indiceGrupo) => {
            const itens = grupo.itens.filter(
              (item) => !item.modulo || podeAceder(usuario?.role, item.modulo),
            );

            if (!itens.length) return null;
            const estaAberto = grupoAberto === indiceGrupo;

            return (
              <section
                key={grupo.titulo}
                className={comprimido ? "mb-0 md:mb-1" : "mb-1"}
              >
                <button
                  type="button"
                  onClick={() => setGrupoManual(estaAberto ? -1 : indiceGrupo)}
                  title={comprimido ? grupo.titulo : undefined}
                  aria-expanded={estaAberto}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[11px] font-bold tracking-wider transition ${comprimido ? "md:hidden" : ""} ${estaAberto ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
                >
                  {estaAberto ? (
                    <FolderOpen
                      size={16}
                      className="shrink-0 text-indigo-500"
                    />
                  ) : (
                    <FolderClosed size={16} className="shrink-0" />
                  )}
                  <span
                    className={`min-w-0 flex-1 truncate ${comprimido ? "md:hidden" : ""}`}
                  >
                    {grupo.titulo}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`shrink-0 transition-transform duration-200 ${estaAberto ? "rotate-180" : ""} ${comprimido ? "md:hidden" : ""}`}
                  />
                </button>
                {comprimido && indiceGrupo > 0 && (
                  <div className="mx-auto my-2 hidden h-px w-7 bg-slate-200 md:block" />
                )}

                {(estaAberto || comprimido) && (
                  <div
                    className={`mt-1 space-y-1 ${comprimido ? (!estaAberto ? "hidden md:block" : "") : "ml-3 border-l border-slate-200 pl-2"}`}
                  >
                    {itens.map((item) => (
                      <NavLink
                        key={item.id}
                        to={destinoItem(item.id)}
                        end={item.end}
                        onClick={() => {
                          setGrupoManual(null);
                          setAberto(false);
                        }}
                        title={comprimido ? item.label : undefined}
                        className={({ isActive }) =>
                          `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${comprimido ? "md:mx-auto md:h-10 md:w-10 md:justify-center md:gap-0 md:p-0" : ""} ${
                            isActive
                              ? "bg-indigo-50 text-indigo-700 shadow-sm"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`
                        }
                      >
                        <item.icon size={19} className="shrink-0" />
                        <span
                          className={`truncate ${comprimido ? "md:hidden" : ""}`}
                        >
                          {item.label}
                        </span>
                      </NavLink>
                    ))}
                  </div>
                )}
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
            title={comprimido ? "Guia rápido" : undefined}
            className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 ${comprimido ? "md:justify-center md:gap-0 md:px-2 md:py-3" : ""}`}
          >
            <BookOpen size={18} className="shrink-0" />
            <span className={comprimido ? "md:hidden" : ""}>Guia rápido</span>
          </button>

          <NavLink
            to="/perfil"
            onClick={() => setAberto(false)}
            title={comprimido ? usuario?.nome || "Perfil" : undefined}
            className={`mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100 ${comprimido ? "md:justify-center md:gap-0 md:p-2" : ""}`}
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 font-bold text-indigo-700">
              {usuario?.nome?.charAt(0).toUpperCase() || "U"}
            </span>

            <span className={`min-w-0 ${comprimido ? "md:hidden" : ""}`}>
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
            title={comprimido ? "Terminar sessão" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 ${comprimido ? "md:justify-center md:gap-0 md:px-2 md:py-3" : ""}`}
          >
            <LogOut size={19} className="shrink-0" />
            <span className={comprimido ? "md:hidden" : ""}>
              Terminar sessão
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

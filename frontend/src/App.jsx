import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/navbar";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import ModuleRoute from "./features/access/ModuleRoute";
import Onboarding from "./components/onboarding";

const Dashboard = lazy(() => import("./components/dashboard"));
const Productos = lazy(() => import("./components/productos"));
const Movimentos = lazy(() => import("./components/movimentos"));
const Fornecedor = lazy(() => import("./components/fornecedor"));
const Categoria = lazy(() => import("./components/categoria"));
const Relatorios = lazy(() => import("./components/relatorios"));
const AdicionarProduto = lazy(() => import("./components/adicionarProduto"));
const EditarProduto = lazy(() => import("./components/editarProduto"));
const AdicionarFornecedor = lazy(() => import("./components/adicionarFornecedor"));
const EditarFornecedor = lazy(() => import("./components/editarFornecedor"));
const RegistarMovimento = lazy(() => import("./components/movimentar"));
const AdicionarCategoria = lazy(() => import("./components/adicionarCategoria"));
const EditarCategoria = lazy(() => import("./components/editarCategoria"));
const Financeiro = lazy(() => import("./components/financeiro"));
const Usuarios = lazy(() => import("./components/usuarios"));
const Assinatura = lazy(() => import("./components/assinatura"));
const PlanosAdmin = lazy(() => import("./components/planosAdmin"));
const HistoricoPagamentos = lazy(() => import("./components/historicoPagamentos"));
const Notificacoes = lazy(() => import("./components/notificacoes"));
const RecuperarSenha = lazy(() => import("./components/recuperarSenha"));
const Plataforma = lazy(() => import("./components/plataforma"));
const Perfil = lazy(() => import("./components/perfil"));
const Suporte = lazy(() => import("./components/suporte"));
const Login = lazy(() => import("./components/login"));
const Register = lazy(() => import("./components/register"));
const Landing = lazy(() => import("./components/landingModern"));
const NovaVenda = lazy(() => import("./components/novaVenda"));
const Vendas = lazy(() => import("./components/vendas"));
const DetalheVenda = lazy(() => import("./components/detalheVenda"));
const Clientes = lazy(() => import("./components/clientes"));
const Caixa = lazy(() => import("./components/caixa"));

function Layout() {
  const { usuario } = useAuth();
  const location = useLocation();
  if (usuario?.tipo_conta === "platform_owner" && location.pathname !== "/admin/sistema") return <Navigate to="/admin/sistema" replace />;
  if (usuario?.tipo_conta === "platform_owner") return <div className="vendai-app flex min-h-dvh overflow-hidden bg-gray-50"><Outlet /></div>;
  return <div className="vendai-app flex h-dvh min-w-0 overflow-hidden bg-gray-50"><Navbar /><Outlet /><Onboarding /></div>;
}

export default function App() {
  return <AuthProvider><BrowserRouter><Suspense fallback={<main className="grid min-h-dvh place-items-center bg-slate-50 text-slate-600" role="status">A carregar...</main>}><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/registo" element={<Register />} />
    <Route path="/recuperar-senha" element={<RecuperarSenha />} />
    <Route path="/redefinir-senha" element={<RecuperarSenha />} />
    <Route element={<ProtectedRoute />}><Route element={<Layout />}>
      <Route element={<ModuleRoute modulo="estoque" />}>
        <Route path="/painel" element={<Dashboard />} /><Route path="/overview" element={<Dashboard />} />
        <Route path="/movimentar" element={<RegistarMovimento />} /><Route path="/produtos" element={<Productos />} /><Route path="/productos" element={<Navigate to="/produtos" replace />} />
        <Route path="/movimentos" element={<Movimentos />} /><Route path="/fornecedor" element={<Fornecedor />} />
        <Route path="/categoria" element={<Categoria />} />
        <Route path="/vendas/nova" element={<NovaVenda />} /><Route path="/vendas" element={<Vendas />} /><Route path="/vendas/:id" element={<DetalheVenda />} />
        <Route path="/clientes" element={<Clientes />} /><Route path="/caixa" element={<Caixa />} />
        <Route element={<ModuleRoute modulo="estoque" roles={["admin", "gestor"]} />}>
          <Route path="/adicionarProduto" element={<AdicionarProduto />} /><Route path="/editarProduto/:id" element={<EditarProduto />} />
          <Route path="/adicionarFornecedor" element={<AdicionarFornecedor />} /><Route path="/editarFornecedor/:id" element={<EditarFornecedor />} />
          <Route path="/adicionarCategoria" element={<AdicionarCategoria />} />
          <Route path="/editarCategoria/:id" element={<EditarCategoria />} />
        </Route>
      </Route>
      <Route element={<ModuleRoute modulo="financeiro" />}><Route path="/financeiro" element={<Financeiro />} /></Route>
      <Route element={<ModuleRoute modulo="relatorios" />}><Route path="/relatorios" element={<Relatorios />} /></Route>
      <Route element={<ModuleRoute modulo="administracao" />}><Route path="/usuarios" element={<Usuarios />} /></Route>
      <Route path="/assinatura" element={<Assinatura />} />
      <Route path="/admin/planos" element={<PlanosAdmin />} />
      <Route path="/admin/sistema" element={<Plataforma />} />
      <Route path="/historico-pagamentos" element={<HistoricoPagamentos />} />
      <Route path="/notificacoes" element={<Notificacoes />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/suporte" element={<Suporte />} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></BrowserRouter></AuthProvider>;
}

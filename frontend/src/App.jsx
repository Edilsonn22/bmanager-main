import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/navbar";
import Dashboard from "./components/dashboard";
import Productos from "./components/productos";
import Movimentos from "./components/movimentos";
import Fornecedor from "./components/fornecedor";
import Categoria from "./components/categoria";
import Relatorios from "./components/relatorios";
import AdicionarProduto from "./components/adicionarProduto";
import EditarProduto from "./components/editarProduto";
import AdicionarFornecedor from "./components/adicionarFornecedor";
import EditarFornecedor from "./components/editarFornecedor";
import RegistarMovimento from "./components/movimentar";
import AdicionarCategoria from "./components/adicionarCategoria";
import EditarCategoria from "./components/editarCategoria";
import Financeiro from "./components/financeiro";
import Usuarios from "./components/usuarios";
import Assinatura from "./components/assinatura";
import PlanosAdmin from "./components/planosAdmin";
import HistoricoPagamentos from "./components/historicoPagamentos";
import Notificacoes from "./components/notificacoes";
import RecuperarSenha from "./components/recuperarSenha";
import Plataforma from "./components/plataforma";
import Perfil from "./components/perfil";
import Suporte from "./components/suporte";
import Login from "./components/login";
import Register from "./components/register";
import Landing from "./components/landingModern";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import ModuleRoute from "./features/access/ModuleRoute";
import Onboarding from "./components/onboarding";

function Layout() {
  const { usuario } = useAuth();
  const location = useLocation();
  if (usuario?.tipo_conta === "platform_owner" && location.pathname !== "/admin/sistema") return <Navigate to="/admin/sistema" replace />;
  if (usuario?.tipo_conta === "platform_owner") return <div className="vendai-app flex h-screen overflow-hidden bg-gray-50"><Outlet /></div>;
  return <div className="vendai-app flex h-screen overflow-hidden bg-gray-50"><Navbar /><Outlet /><Onboarding /></div>;
}

export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/registo" element={<Register />} />
    <Route path="/recuperar-senha" element={<RecuperarSenha />} />
    <Route path="/redefinir-senha" element={<RecuperarSenha />} />
    <Route element={<ProtectedRoute />}><Route element={<Layout />}>
      <Route element={<ModuleRoute modulo="estoque" />}>
        <Route path="/painel" element={<Dashboard />} /><Route path="/overview" element={<Dashboard />} />
        <Route path="/movimentar" element={<RegistarMovimento />} /><Route path="/productos" element={<Productos />} />
        <Route path="/movimentos" element={<Movimentos />} /><Route path="/fornecedor" element={<Fornecedor />} />
        <Route path="/categoria" element={<Categoria />} />
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
  </Routes></BrowserRouter></AuthProvider>;
}

import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { podeAceder } from "./permissions";
import AccessDenied from "./AccessDenied";

export default function ModuleRoute({ modulo, roles }) {
  const { usuario } = useAuth();
  const autorizadoNoModulo = podeAceder(usuario?.role, modulo);
  const autorizadoNoPapel = !roles || roles.includes(usuario?.role);
  return autorizadoNoModulo && autorizadoNoPapel ? <Outlet /> : <AccessDenied />;
}

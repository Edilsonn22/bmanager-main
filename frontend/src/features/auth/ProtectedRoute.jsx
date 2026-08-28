import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { autenticado } = useAuth();
  const location = useLocation();
  return autenticado ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

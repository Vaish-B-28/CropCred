import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function RequireRole({ role }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth?mode=signin" replace />;
  return user.role === role ? <Outlet /> : <Navigate to="/" replace />;
}

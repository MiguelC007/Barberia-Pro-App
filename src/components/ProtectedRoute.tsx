import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "../types";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "./LoadingScreen";

export function ProtectedRoute({ allowed }: { allowed?: UserRole[] }) {
  const { user, role, isReady } = useAuth();

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowed && !allowed.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

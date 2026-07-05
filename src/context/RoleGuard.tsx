import type { ReactNode } from "react";
import type { UserRole } from "../types";
import { useAuth } from "./AuthContext";
import { canAccess } from "../utils/permissions";

interface RoleGuardProps {
  allowed: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowed, children, fallback = null }: RoleGuardProps) {
  const { role } = useAuth();
  if (!canAccess(role, allowed)) return <>{fallback}</>;
  return <>{children}</>;
}

import type { UserRole } from "../types";

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: "Superadministración técnica",
    owner: "Dueño administrador",
    barber: "Barbero",
    client: "Cliente",
    guest: "Invitado"
  };
  return labels[role];
}

export function canAccess(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role);
}

export function canManageBusiness(role: UserRole): boolean {
  return role === "owner" || role === "super_admin";
}

export function canOperateQueue(role: UserRole): boolean {
  return role === "barber" || role === "owner" || role === "super_admin";
}

export function canViewAllAppointments(role: UserRole): boolean {
  return role === "owner" || role === "super_admin";
}

export function canViewQueueBoard(role: UserRole): boolean {
  return role === "owner" || role === "super_admin" || role === "barber";
}

export function canViewSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

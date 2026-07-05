import type { UserRole } from "../types";
import { roleLabel } from "../utils/permissions";

export function RoleBadge({ role }: { role: UserRole }) {
  const tone = role === "super_admin" ? "purple" : role === "owner" ? "success" : role === "barber" ? "blue" : "warning";
  return <span className={`badge badge-${tone}`}>{roleLabel(role)}</span>;
}

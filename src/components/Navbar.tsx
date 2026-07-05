import { NavLink } from "react-router-dom";
import { CalendarDays, Home, ListOrdered, MessageCircle, QrCode, Scissors, Shield, UserCog } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { canManageBusiness, canOperateQueue, canViewSuperAdmin } from "../utils/permissions";

export function Navbar() {
  const { role } = useAuth();

  const links = [
    { to: "/", label: "Inicio", icon: Home, show: true },
    { to: "/fila", label: "Turnos", icon: ListOrdered, show: true },
    { to: "/citas", label: "Citas", icon: CalendarDays, show: true },
    { to: "/chatbot", label: "Chat Bot", icon: MessageCircle, show: true },
    { to: "/pago", label: "Pago QR", icon: QrCode, show: true },
    { to: "/barbero", label: "Barbero", icon: Scissors, show: canOperateQueue(role) },
    { to: "/dueno", label: "Dueño", icon: UserCog, show: canManageBusiness(role) },
    { to: "/super-admin", label: "Super Admin", icon: Shield, show: canViewSuperAdmin(role) }
  ];

  return (
    <nav className="nav-tabs">
      {links.filter((link) => link.show).map((link) => {
        const Icon = link.icon;
        return (
          <NavLink to={link.to} key={link.to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            <Icon size={17} />
            {link.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

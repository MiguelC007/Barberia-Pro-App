import { Outlet, useNavigate } from "react-router-dom";
import { Download, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { RoleBadge } from "./RoleBadge";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../services/localStore";
import { initials } from "../utils/format";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function Layout() {
  const { user, logout } = useAuth();
  const state = useAppData();
  const navigate = useNavigate();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo-mark">{state.business.logoText}</div>
          <div>
            <h1>{state.business.appName}</h1>
            <p>Turnos, citas y pagos en un solo lugar</p>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="user-chip">
            <div className="avatar">{initials(user?.name || "U")}</div>
            <div>
              <strong>{user?.name}</strong>
              {user && <RoleBadge role={user.role} />}
            </div>
          </div>

          <button className="btn ghost" title="Instalar app" onClick={handleInstall} disabled={!installPrompt}>
            <Download size={17} />
            Instalar
          </button>

          <button className="btn danger" onClick={handleLogout}>
            <LogOut size={17} />
            Salir
          </button>
        </div>
      </header>

      <Navbar />

      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}

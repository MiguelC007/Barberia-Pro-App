import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { useAppData } from "../services/localStore";
import { isUsingDemoAuth } from "../services/authService";

export default function Login() {
  const state = useAppData();
  const { user, isReady, login, loginClient, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"staff" | "client">("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [error, setError] = useState("");

  if (!isReady) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  async function handleStaffLogin() {
    try {
      setError("");
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesion.");
    }
  }

  function handleClientLogin() {
    loginClient(clientName || "Cliente", clientPhone);
    navigate("/");
  }

  function handleGuest() {
    continueAsGuest();
    navigate("/");
  }

  return (
    <div className="login-screen">
      <section className="login-hero">
        <span className="badge badge-warning">App privada por barberia</span>
        <h1>Login por roles para {state.business.appName}.</h1>
        <p>
          El cliente puede usar la app como invitado. El barbero tiene acceso limitado. El dueno administra su barberia.
          El Super Admin tecnico controla todo.
        </p>

        <div className="hero-stats">
          <div>
            <strong>1</strong>
            <span>Barberia</span>
          </div>
          <div>
            <strong>Turnos</strong>
            <span>Entrada</span>
          </div>
          <div>
            <strong>QR</strong>
            <span>Entrada/Pago</span>
          </div>
          <div>
            <strong>PWA</strong>
            <span>Instalable</span>
          </div>
        </div>
      </section>

      <section className="login-card">
        <div className="section-heading">
          <div>
            <h2>Acceso</h2>
            <p>
              {isUsingDemoAuth()
                ? "Modo demo/localStorage activo. Firebase queda preparado."
                : "Firebase configurado para Spencer Barber Shop. La demo local sigue disponible para presentaciones."}
            </p>
          </div>
          <Lock />
        </div>

        <div className="switcher">
          <button className={mode === "staff" ? "active" : ""} onClick={() => setMode("staff")}>
            Staff/Admin
          </button>
          <button className={mode === "client" ? "active" : ""} onClick={() => setMode("client")}>
            Cliente
          </button>
        </div>

        {mode === "staff" ? (
          <div className="form-card">
            <label>
              Correo
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                placeholder="correo@spencerbarber.com"
              />
            </label>
            <label>
              Contrasena
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Tu contrasena privada"
              />
            </label>

            {error && <div className="alert danger">{error}</div>}

            <button className="btn primary full" onClick={handleStaffLogin}>
              Entrar
            </button>

            <div className="demo-box">
              <strong>Cuentas demo</strong>
              <p>Super Admin: super@barberhn.com / 123456</p>
              <p>Dueno/Admin: spencer@spencerbarber.com / 123456</p>
            </div>
          </div>
        ) : (
          <div className="form-card">
            <label>
              Nombre
              <input
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Ej. Carlos Mejia"
              />
            </label>
            <label>
              WhatsApp opcional
              <input
                value={clientPhone}
                onChange={(event) => setClientPhone(event.target.value)}
                placeholder="50400000000"
              />
            </label>

            <button className="btn primary full" onClick={handleClientLogin}>
              <UserRound size={18} />
              Entrar como cliente
            </button>
            <button className="btn ghost full" onClick={handleGuest}>
              Continuar como invitado
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CalendarCheck, Clock3, Lock, QrCode, Scissors, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { useAppData } from "../services/localStore";
import type { UserRole } from "../types";
import "../styles/login-premium.css";

const benefits = [
  { label: "Toma tu turno", icon: QrCode },
  { label: "Agenda tu cita", icon: CalendarCheck },
  { label: "Llega sin filas", icon: Clock3 },
  { label: "Guarda la app", icon: Smartphone }
];

function getPostLoginPath(role: UserRole): string {
  if (role === "super_admin") return "/super-admin";
  if (role === "owner") return "/dueno";
  if (role === "barber") return "/barbero";
  return "/";
}

export default function Login() {
  const state = useAppData();
  const { user, isReady, login, loginClient, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"staff" | "guest">("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [error, setError] = useState("");

  const appName = state.business.appName || "Spencer Barber Shop";

  if (!isReady) return <LoadingScreen />;
  if (user) return <Navigate to={getPostLoginPath(user.role)} replace />;

  async function handleStaffLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      const session = await login({ email, password });
      navigate(getPostLoginPath(session.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    }
  }

  function handleGuestLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (clientName.trim()) {
      loginClient(clientName, clientPhone);
    } else {
      continueAsGuest();
    }

    navigate("/");
  }

  function handleGuest() {
    continueAsGuest();
    navigate("/");
  }

  return (
    <main className="login-premium-screen">
      <section className="login-premium-hero" aria-label="Presentación de Spencer Barber Shop">
        <div className="login-premium-glow" aria-hidden="true" />

        <div className="login-premium-brand-row">
          <div className="login-premium-logo">
            <Scissors size={28} />
          </div>
          <div>
            <span>Spencer Barber Shop</span>
            <strong>Bienvenido</strong>
          </div>
        </div>

        <div className="login-premium-copy">
          <span className="login-premium-eyebrow">Tu corte empieza aquí</span>
          <h1>{appName}</h1>
          <p className="login-premium-lead">
            Reserva tu lugar, llega tranquilo y disfruta una atención rápida, cómoda y bien organizada.
          </p>
          <p className="login-premium-text">
            En Spencer Barber Shop cuidamos tu tiempo y tu estilo. Entra, toma tu turno o agenda tu próxima visita en segundos.
          </p>
        </div>

        <div className="login-benefits-grid" aria-label="Accesos principales para clientes">
          {benefits.map(({ label, icon: Icon }) => (
            <article className="login-benefit-card" key={label}>
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </article>
          ))}
        </div>

        <div className="login-proof-card">
          <div>
            <strong>Fácil</strong>
            <span>entra en segundos</span>
          </div>
          <div>
            <strong>Claro</strong>
            <span>mira tu turno</span>
          </div>
          <div>
            <strong>Cómodo</strong>
            <span>desde tu celular</span>
          </div>
        </div>
      </section>

      <section className="login-premium-panel" aria-label="Acceso a Spencer Barber Shop">
        <div className="login-panel-header">
          <div>
            <span className="login-secure-badge">
              <ShieldCheck size={15} /> Acceso seguro
            </span>
            <h2>{mode === "staff" ? "Iniciar sesión" : "Entrar como invitado"}</h2>
            <p>{mode === "staff" ? "Usa tu correo y contraseña para entrar." : "No necesitas crear cuenta para comenzar."}</p>
          </div>
          <div className="login-lock-bubble" aria-hidden="true">
            <Lock />
          </div>
        </div>

        <div className="login-mode-switcher" role="tablist" aria-label="Tipo de acceso">
          <button type="button" className={mode === "staff" ? "active" : ""} onClick={() => setMode("staff")} aria-selected={mode === "staff"}>
            Log in
          </button>
          <button type="button" className={mode === "guest" ? "active" : ""} onClick={() => setMode("guest")} aria-selected={mode === "guest"}>
            Invitado
          </button>
        </div>

        {mode === "staff" ? (
          <form className="login-form-card" onSubmit={handleStaffLogin}>
            <div className="login-form-intro">
              <h3>Acceso del equipo</h3>
              <p>El sistema te llevará automáticamente al panel que corresponde a tu usuario.</p>
            </div>

            <label>
              Correo
              <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" inputMode="email" placeholder="correo@spencerbarber.com" required />
            </label>

            <label>
              Contraseña
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Tu contraseña" required />
            </label>

            {error && <div className="alert danger">{error}</div>}

            <button className="btn primary full login-submit-button" type="submit">
              Iniciar sesión
            </button>
          </form>
        ) : (
          <form className="login-form-card" onSubmit={handleGuestLogin}>
            <div className="login-form-intro">
              <h3>Entrada rápida</h3>
              <p>Escribe tu nombre para tomar turno o entra sin registrarte.</p>
            </div>

            <label>
              Nombre
              <input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Ej. Carlos Mejía" autoComplete="name" />
            </label>

            <label>
              Número opcional
              <input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="50400000000" autoComplete="tel" inputMode="tel" />
            </label>

            <button className="btn primary full login-submit-button" type="submit">
              <UserRound size={18} /> Entrar
            </button>
            <button className="btn ghost full" type="button" onClick={handleGuest}>
              Entrar sin datos
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

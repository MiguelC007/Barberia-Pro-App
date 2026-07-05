import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CalendarCheck, CreditCard, Lock, QrCode, Scissors, ShieldCheck, Smartphone, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { useAppData } from "../services/localStore";
import "../styles/login-premium.css";

const benefits = [
  { label: "Turnos por QR", icon: QrCode },
  { label: "Citas inteligentes", icon: CalendarCheck },
  { label: "Pago por QR", icon: CreditCard },
  { label: "App instalable", icon: Smartphone }
];

const accessTypes = [
  {
    title: "Cliente",
    text: "Puede tomar turno, reservar cita, enviar referencias y consultar su proceso."
  },
  {
    title: "Barbero",
    text: "Acceso privado para atender turnos, revisar citas y dar seguimiento."
  },
  {
    title: "Dueño administrador",
    text: "Control del negocio, pagos, servicios, branding y operación diaria."
  },
  {
    title: "Superadministración",
    text: "Soporte técnico, mantenimiento y configuración avanzada del sistema."
  }
];

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

  const appName = state.business.appName || "Spencer Barber Shop";

  if (!isReady) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;

  async function handleStaffLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError("");
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    }
  }

  function handleClientLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginClient(clientName || "Cliente", clientPhone);
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
            <strong>Sistema privado</strong>
          </div>
        </div>

        <div className="login-premium-copy">
          <span className="login-premium-eyebrow">Gestión profesional para barbería</span>
          <h1>{appName}</h1>
          <p className="login-premium-lead">
            Gestiona turnos, citas, pagos y clientes desde una sola plataforma ordenada.
          </p>
          <p className="login-premium-text">
            Tus clientes pueden tomar turno por QR, reservar citas, enviar referencias de corte y pagar por QR. El equipo administra todo desde un panel privado y seguro.
          </p>
        </div>

        <div className="login-benefits-grid" aria-label="Beneficios principales">
          {benefits.map(({ label, icon: Icon }) => (
            <article className="login-benefit-card" key={label}>
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </article>
          ))}
        </div>

        <div className="login-proof-card">
          <div>
            <strong>1</strong>
            <span>barbería</span>
          </div>
          <div>
            <strong>QR</strong>
            <span>ingreso/pago</span>
          </div>
          <div>
            <strong>PWA</strong>
            <span>instalable</span>
          </div>
        </div>
      </section>

      <section className="login-premium-panel" aria-label="Acceso al sistema">
        <div className="login-panel-header">
          <div>
            <span className="login-secure-badge">
              <ShieldCheck size={15} /> Acceso privado
            </span>
            <h2>Entrar al sistema</h2>
            <p>Ingreso seguro para Spencer Barber Shop.</p>
          </div>
          <div className="login-lock-bubble" aria-hidden="true">
            <Lock />
          </div>
        </div>

        <div className="login-trust-note">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>Turnos, citas y datos operativos protegidos con acceso por rol.</span>
        </div>

        <div className="login-mode-switcher" role="tablist" aria-label="Tipo de acceso">
          <button type="button" className={mode === "staff" ? "active" : ""} onClick={() => setMode("staff")} aria-selected={mode === "staff"}>
            Dueño / Barbero
          </button>
          <button type="button" className={mode === "client" ? "active" : ""} onClick={() => setMode("client")} aria-selected={mode === "client"}>
            Cliente / Invitado
          </button>
        </div>

        {mode === "staff" ? (
          <form className="login-form-card" onSubmit={handleStaffLogin}>
            <div className="login-form-intro">
              <h3>Panel privado del negocio</h3>
              <p>Ingresa con tu correo autorizado para administrar la operación de la barbería.</p>
            </div>

            <label>
              Correo
              <input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" inputMode="email" placeholder="correo@spencerbarber.com" required />
            </label>

            <label>
              Contraseña
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Tu contraseña privada" required />
            </label>

            {error && <div className="alert danger">{error}</div>}

            <button className="btn primary full login-submit-button" type="submit">
              Entrar de forma segura
            </button>
          </form>
        ) : (
          <form className="login-form-card" onSubmit={handleClientLogin}>
            <div className="login-form-intro">
              <h3>Entrada rápida para clientes</h3>
              <p>El cliente puede continuar como invitado o dejar sus datos para recibir mejor seguimiento.</p>
            </div>

            <label>
              Nombre
              <input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Ej. Carlos Mejía" autoComplete="name" />
            </label>

            <label>
              WhatsApp opcional
              <input value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} placeholder="50400000000" autoComplete="tel" inputMode="tel" />
            </label>

            <button className="btn primary full login-submit-button" type="submit">
              <UserRound size={18} /> Entrar como cliente
            </button>
            <button className="btn ghost full" type="button" onClick={handleGuest}>
              Continuar como invitado
            </button>
          </form>
        )}

        <div className="login-access-grid">
          {accessTypes.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

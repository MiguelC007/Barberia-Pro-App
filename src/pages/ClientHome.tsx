import { useNavigate } from "react-router-dom";
import {
  CalendarCheck,
  Clock,
  MessageCircle,
  QrCode,
  Scissors,
  Sparkles,
  Ticket,
} from "lucide-react";

import { BarberCard } from "../components/BarberCard";
import { QRCheckIn } from "../components/QRCheckIn";
import { ServiceCard } from "../components/ServiceCard";
import { StatCard } from "../components/StatCard";
import { useAppData } from "../services/localStore";
import { calculateNextTurnEstimate, calculateQueueTimeline } from "../utils/queueTimeline";
import { minutesToText } from "../utils/time";
import { whatsappLink } from "../utils/format";

const trendingCuts = [
  "Low Fade",
  "Mid Fade",
  "Taper Fade",
  "French Crop",
  "Corte + Barba",
  "Burst Fade",
];

export default function ClientHome() {
  const state = useAppData();
  const navigate = useNavigate();

  const timeline = calculateQueueTimeline(state);
  const nextTurnEstimate = calculateNextTurnEstimate(state);
  const waiting = timeline.length;
  const available = state.barbers.filter((barber) => barber.status === "available").length;
  const activeServices = state.services.filter((service) => service.active);
  const eta = minutesToText(nextTurnEstimate.waitMinutes);

  const primaryMessage =
    waiting > 0
      ? `Hay ${waiting} cliente${waiting === 1 ? "" : "s"} esperando. Tu tiempo estimado sería ${eta}.`
      : "No hay espera por ahora. Podés tomar turno o agendar tu cita.";

  return (
    <div className="grid gap-lg home-pro">
      <section className="hero-card home-hero-pro">
        <div className="home-hero-copy">
          <span className="badge badge-warning hero-eyebrow">
            <Sparkles size={15} />
            App privada de Spencer Barber Shop
          </span>

          <h2 className="hero-title">{state.business.appName}</h2>

          <p className="hero-subtitle">
            Tomá tu turno al llegar, reservá tu cita y recibí una atención más ordenada sin perder tiempo.
          </p>

          <div className="trust-row">
            <span>
              <Ticket size={16} />
              Ticket automático
            </span>
            <span>
              <Clock size={16} />
              Espera estimada
            </span>
            <span>
              <QrCode size={16} />
              QR de entrada
            </span>
          </div>

          <div className="actions home-cta-row">
            <button className="btn primary" onClick={() => navigate("/turno")}>
              <Ticket size={18} />
              Tomar turno
            </button>

            <button className="btn ghost" onClick={() => navigate("/citas")}>
              <CalendarCheck size={18} />
              Agendar cita
            </button>

            <a
              className="btn blue"
              href={whatsappLink(
                state.business.whatsapp,
                `Hola, quiero informacion de ${state.business.appName}`
              )}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>
          </div>
        </div>

        <aside className="hero-live-card">
          <div className="live-pill">En vivo</div>
          <h3>{primaryMessage}</h3>
          <p>{state.business.publicMessage}</p>

          <div className="live-meta-grid">
            <div>
              <strong>{waiting}</strong>
              <span>en espera</span>
            </div>
            <div>
              <strong>{available}</strong>
              <span>disponible{available === 1 ? "" : "s"}</span>
            </div>
            <div>
              <strong>{eta}</strong>
              <span>espera aprox.</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="stats-grid home-stats-row">
        <StatCard label="En espera" value={waiting} />
        <StatCard label="Barberos disponibles" value={available} />
        <StatCard label="Espera aproximada" value={eta} />
        <StatCard label="Servicios activos" value={activeServices.length} />
      </section>

      <section className="dashboard-grid home-main-grid">
        <div className="panel home-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Servicios</span>
              <h3>Servicios disponibles</h3>
              <p>Precios y duración configurados para la barbería.</p>
            </div>
          </div>

          <div className="cards-grid service-grid-pro">
            {activeServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>

        <div className="panel home-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Equipo</span>
              <h3>Barbero disponible</h3>
              <p>Disponibilidad actual para turnos y citas.</p>
            </div>
          </div>

          <div className="stack">
            {state.barbers
              .filter((barber) => barber.active)
              .map((barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid home-main-grid">
        <div className="qr-feature-panel">
          <div className="qr-feature-copy">
            <span className="section-kicker">Entrada rápida</span>
            <h3>Escaneá el QR y tomá tu turno automáticamente</h3>
            <p>
              El cliente no necesita llenar formularios para entrar a la lista. Escanea, recibe su ticket y puede ver su
              tiempo estimado.
            </p>

            <button className="btn primary" onClick={() => navigate("/turno")}>
              Probar QR como cliente
            </button>
          </div>

          <QRCheckIn />
        </div>

        <div className="panel home-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Recomendaciones</span>
              <h3>Cortes en tendencia</h3>
              <p>Ideas rápidas que el cliente puede pedir en turno, cita o chat.</p>
            </div>
          </div>

          <div className="cards-grid trend-grid-pro">
            {trendingCuts.map((cut) => (
              <article className="trend-card trend-card-pro" key={cut}>
                <div className="trend-mark">
                  <Scissors size={20} />
                </div>
                <strong>{cut}</strong>
                <p>Disponible para pedir con Spencer.</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
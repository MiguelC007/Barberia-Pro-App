import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, MessageCircle, Ticket } from "lucide-react";
import { BarberCard } from "../components/BarberCard";
import { QRCheckIn } from "../components/QRCheckIn";
import { ServiceCard } from "../components/ServiceCard";
import { StatCard } from "../components/StatCard";
import { useLiveNow } from "../hooks/useLiveNow";
import { useAppData } from "../services/localStore";
import type { InspirationItem } from "../types";
import { whatsappLink } from "../utils/format";
import { getInspirationImage, getInspirationItems } from "../utils/inspiration";
import { calculateNextTurnEstimate, calculateQueueTimeline } from "../utils/queueTimeline";
import { minutesToText } from "../utils/time";

export default function ClientHome() {
  const state = useAppData();
  const navigate = useNavigate();
  const now = useLiveNow(30000);

  const timeline = useMemo(() => calculateQueueTimeline(state, now), [state, now]);
  const nextTurnEstimate = useMemo(() => calculateNextTurnEstimate(state, now), [state, now]);
  const trends = useMemo(
    () => getInspirationItems((state as typeof state & { inspiration?: InspirationItem[] }).inspiration),
    [state]
  );

  const waiting = timeline.length;
  const available = state.barbers.filter((barber) => barber.status === "available").length;
  const activeServices = state.services.filter((service) => service.active);
  const eta = minutesToText(nextTurnEstimate.waitMinutes);

  const primaryMessage =
    waiting > 0
      ? `Hay ${waiting} cliente${waiting === 1 ? "" : "s"} esperando. Atención aproximada: ${eta}.`
      : "No hay espera por ahora. Puedes tomar un turno o agendar tu cita.";

  const availabilityLabel =
    available > 0
      ? `${available} disponible${available === 1 ? "" : "s"}`
      : "Todos los barberos están ocupados. Te atenderemos por orden de llegada.";

  return (
    <div className="grid gap-lg home-pro">
      <section className="hero-card home-hero-pro">
        <div className="home-hero-copy">
          <h2 className="hero-title">{state.business.appName}</h2>

          <p className="hero-subtitle">
            Toma tu turno, agenda tu cita o escribe por WhatsApp desde un solo lugar.
          </p>

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
              href={whatsappLink(state.business.whatsapp, `Hola, quiero información de ${state.business.appName}.`)}
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
          <p>Revisa la disponibilidad actual antes de llegar o pedir tu cita.</p>

          <div className="live-meta-grid">
            <div>
              <strong>{waiting}</strong>
              <span>esperando</span>
            </div>

            <div>
              <strong>{available > 0 ? available : "—"}</strong>
              <span>{availabilityLabel}</span>
            </div>

            <div>
              <strong>{eta}</strong>
              <span>tiempo estimado</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="stats-grid home-stats-row">
        <StatCard label="Clientes esperando" value={waiting} />
        <StatCard label="Barberos disponibles" value={available > 0 ? available : "—"} />
        <StatCard label="Tiempo estimado" value={eta} />
        <StatCard label="Servicios activos" value={activeServices.length} />
      </section>

      <section className="dashboard-grid home-main-grid">
        <div className="panel home-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Servicios</span>
              <h3>Servicios disponibles</h3>
              <p>Elige el servicio que necesitas y revisa precio, duración y disponibilidad.</p>
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
              <h3>Barberos activos</h3>
              <p>
                {available > 0
                  ? "Disponibles para turnos y citas."
                  : "Todos están ocupados. Te atenderemos por orden de llegada."}
              </p>
            </div>
          </div>

          <div className="stack">
            {state.barbers
              .filter((barber) => barber.active)
              .map((barber) => (
                <BarberCard key={barber.id} barber={barber} now={now} />
              ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid home-main-grid home-bottom-clean">
        <div className="panel home-panel qr-home-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Entrada rápida</span>
              <h3>Escanea el QR y mira tu turno desde tu celular</h3>
              <p>Al llegar puedes entrar a la lista de espera, ver tu posición y saber cuándo se acerca tu atención.</p>
            </div>
          </div>

          <div className="actions">
            <button className="btn primary" onClick={() => navigate("/turno")}>
              Tomar turno
            </button>
            <button className="btn ghost" onClick={() => navigate("/fila")}>
              Ver fila
            </button>
          </div>

          <div className="qr-compact-wrap">
            <QRCheckIn />
          </div>
        </div>

        <div className="panel home-panel">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Inspiración</span>
              <h3>Cortes en tendencia</h3>
              <p>Ideas visuales para elegir tu próximo corte.</p>
            </div>
          </div>

          <div className="cards-grid trend-grid-pro">
            {trends.map((cut) => (
              <article className="trend-card trend-card-pro" key={cut.id}>
                <div className="trend-card-media">
                  <img src={getInspirationImage(cut)} alt={cut.title} loading="lazy" />
                </div>

                <div className="trend-card-content">
                  <strong>{cut.title}</strong>
                  <p>{cut.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

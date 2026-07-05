import { useNavigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { BarberCard } from "../components/BarberCard";
import { QRCheckIn } from "../components/QRCheckIn";
import { ServiceCard } from "../components/ServiceCard";
import { StatCard } from "../components/StatCard";
import { useAppData } from "../services/localStore";
import { calculateNextTurnEstimate, calculateQueueTimeline } from "../utils/queueTimeline";
import { minutesToText } from "../utils/time";
import { whatsappLink } from "../utils/format";

export default function ClientHome() {
  const state = useAppData();
  const navigate = useNavigate();
  const timeline = calculateQueueTimeline(state);
  const nextTurnEstimate = calculateNextTurnEstimate(state);

  const waiting = timeline.length;
  const available = state.barbers.filter((barber) => barber.status === "available").length;
  const eta = minutesToText(nextTurnEstimate.waitMinutes);

  return (
    <div className="grid gap-lg">
      <section className="hero-card">
        <div>
          <span className="badge badge-warning">App unica de esta barberia</span>
          <h2>{state.business.appName}</h2>
          <p>{state.business.publicMessage}</p>
          <div className="actions">
            <button className="btn primary" onClick={() => navigate("/citas")}>Agendar cita</button>
            <button className="btn ghost" onClick={() => navigate("/fila")}>Ver turnos</button>
            <a className="btn blue" href={whatsappLink(state.business.whatsapp, `Hola, quiero informacion de ${state.business.appName}`)} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              WhatsApp
            </a>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard label="En espera" value={waiting} />
          <StatCard label="Disponibles" value={available} />
          <StatCard label="Espera aprox." value={eta} />
          <StatCard label="Servicios" value={state.services.length} />
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <h3>Servicios disponibles</h3>
              <p>Precios y duracion configurados por el dueno.</p>
            </div>
          </div>
          <div className="cards-grid">
            {state.services.filter((service) => service.active).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <h3>Barberos</h3>
              <p>Disponibilidad en vivo.</p>
            </div>
          </div>
          <div className="stack">
            {state.barbers.filter((barber) => barber.active).map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <QRCheckIn />

        <div className="panel">
          <div className="section-heading">
            <div>
              <h3>Cortes en tendencia</h3>
              <p>Base preparada para recomendaciones y agenda inteligente.</p>
            </div>
          </div>
          <div className="cards-grid">
            {["Low Fade", "Mid Fade", "Taper Fade", "French Crop", "Corte + Barba", "Burst Fade"].map((cut) => (
              <article className="trend-card" key={cut}>
                <div>SB</div>
                <strong>{cut}</strong>
                <p>Disponible para solicitar en nota de cita o turno.</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

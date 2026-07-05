import { Clock, Scissors, Ticket, UserRound } from "lucide-react";
import type { AppState, QueueItem } from "../types";
import { calculateQueueTimeline, ticketSourceLabel, ticketStatusLabel } from "../utils/queueTimeline";
import { minutesToText, timeLabel } from "../utils/time";

export function TicketCard({ item, state, compact = false }: { item: QueueItem; state: AppState; compact?: boolean }) {
  const timeline = calculateQueueTimeline(state).find((entry) => entry.item.id === item.id);
  const service = state.services.find((entry) => entry.id === item.serviceId);
  const assignedBarber = item.assignedBarberId
    ? state.barbers.find((barber) => barber.id === item.assignedBarberId)?.name
    : null;
  const preferredBarber = item.preferredBarberId
    ? state.barbers.find((barber) => barber.id === item.preferredBarberId)?.name
    : null;
  const barberName = assignedBarber || timeline?.assignedBarberSuggestion || preferredBarber || "Por asignar";
  const position = timeline?.position || item.position || item.dailySequenceNumber || 1;
  const wait = timeline?.estimatedWaitMinutes ?? 0;
  const waited = timeline?.waitedMinutes ?? 0;

  return (
    <article className={`ticket-card ${compact ? "compact" : ""}`}>
      <div className="ticket-card-header">
        <div>
          <span className="badge badge-warning">Turno #{position}</span>
          <h2>{item.ticketCode || `Turno ${position}`}</h2>
        </div>
        <div className="icon-bubble">
          <Ticket size={22} />
        </div>
      </div>

      <div className="ticket-status-row">
        <span className="badge badge-success">{ticketStatusLabel(item.status)}</span>
        <strong>{wait <= 5 ? "Casi listo" : `Aprox. ${minutesToText(wait)}`}</strong>
      </div>

      <div className="ticket-grid">
        <div>
          <UserRound size={16} />
          <span>{item.clientName}</span>
        </div>
        <div>
          <Scissors size={16} />
          <span>{service?.name || item.serviceName || "Servicio pendiente"}</span>
        </div>
        <div>
          <Clock size={16} />
          <span>Esperando {minutesToText(waited)}</span>
        </div>
        <div>
          <Clock size={16} />
          <span>{timeline ? `Atencion ${timeLabel(timeline.estimatedStartAt)}` : "Calculando"}</span>
        </div>
        <div>
          <Ticket size={16} />
          <span>Fuente {ticketSourceLabel(item.source)}</span>
        </div>
        <div>
          <Scissors size={16} />
          <span>{barberName}</span>
        </div>
      </div>

      {!compact && (
        <p className="ticket-note">
          Barbero: {barberName}. Te atenderemos en orden segun los turnos actuales.
        </p>
      )}
    </article>
  );
}

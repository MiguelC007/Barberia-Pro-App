import type { AppState } from "../types";
import { calculateQueueTimeline, isActiveTicketStatus, ticketSourceLabel, ticketStatusLabel } from "../utils/queueTimeline";
import { minutesToText, timeLabel } from "../utils/time";
import { EmptyState } from "./EmptyState";
import { MediaReferenceList } from "./MediaReferenceList";

export function QueueList({ state }: { state: AppState }) {
  const timeline = calculateQueueTimeline(state).filter((entry) => isActiveTicketStatus(entry.item.status));

  if (!timeline.length) {
    return <EmptyState title="No hay clientes esperando" text="La lista de turnos esta libre por ahora." />;
  }

  return (
    <div className="list">
      {timeline.map((entry) => {
        const service = state.services.find((item) => item.id === entry.item.serviceId);
        const barber = entry.assignedBarberSuggestion || "Por asignar";

        return (
          <article className="list-item ticket-list-item" key={entry.item.id}>
            <div className="queue-number">{entry.position}</div>
            <div>
              <strong>{entry.item.clientName}</strong>
              <p>
                {entry.item.ticketCode || `Turno ${entry.position}`} - {service?.name || entry.item.serviceName || "Servicio"}
              </p>
              <small>
                {ticketStatusLabel(entry.item.status)} - {barber} - Espera {minutesToText(entry.waitedMinutes)}
              </small>
              <small>
                Ticket {entry.item.ticketCode || `Turno ${entry.position}`} - Fuente {ticketSourceLabel(entry.item.source)} - Atencion {timeLabel(entry.estimatedStartAt)}
              </small>
              {entry.item.note && <small>{entry.item.note}</small>}
              <MediaReferenceList items={entry.item.mediaReferences || []} title="Referencia del cliente" />
            </div>
            <span className={`badge ${entry.position === 1 ? "badge-success" : "badge-warning"}`}>
              {entry.position === 1 ? "Siguiente" : `${minutesToText(entry.estimatedWaitMinutes)} - ${timeLabel(entry.estimatedStartAt)}`}
            </span>
          </article>
        );
      })}
    </div>
  );
}

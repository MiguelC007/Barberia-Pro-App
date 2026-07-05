import { Clock3, Scissors, Ticket, Timer, UserRound } from "lucide-react";

import type { AppState } from "../types";
import {
  calculateQueueTimeline,
  isActiveTicketStatus,
  ticketSourceLabel,
  ticketStatusLabel,
} from "../utils/queueTimeline";
import { minutesToText, timeLabel } from "../utils/time";

import { EmptyState } from "./EmptyState";
import { MediaReferenceList } from "./MediaReferenceList";

export function QueueList({ state }: { state: AppState }) {
  const timeline = calculateQueueTimeline(state).filter((entry) =>
    isActiveTicketStatus(entry.item.status)
  );

  if (!timeline.length) {
    return (
      <EmptyState
        title="No hay clientes esperando"
        text="La lista de turnos está libre por ahora."
      />
    );
  }

  return (
    <div className="queue-list-pro">
      {timeline.map((entry) => {
        const service = state.services.find((item) => item.id === entry.item.serviceId);
        const barber = entry.assignedBarberSuggestion || "Por asignar";
        const isNext = entry.position === 1;
        const ticketCode = entry.item.ticketCode || `Turno ${entry.position}`;
        const serviceName = service?.name || entry.item.serviceName || "Servicio pendiente";

        return (
          <article
            className={`queue-ticket-row ${isNext ? "is-next" : ""}`}
            key={entry.item.id}
          >
            <div className="queue-rank">
              <span>{entry.position}</span>
              <small>{isNext ? "Siguiente" : "En turno"}</small>
            </div>

            <div className="queue-ticket-main">
              <div className="queue-ticket-head">
                <div>
                  <h4>{entry.item.clientName || "Cliente"}</h4>
                  <p>
                    <Ticket size={15} />
                    {ticketCode}
                  </p>
                </div>

                <span className={`badge ${isNext ? "badge-success" : "badge-warning"}`}>
                  {ticketStatusLabel(entry.item.status)}
                </span>
              </div>

              <div className="queue-meta-grid">
                <span>
                  <Scissors size={15} />
                  {serviceName}
                </span>

                <span>
                  <UserRound size={15} />
                  {barber}
                </span>

                <span>
                  <Timer size={15} />
                  Esperando {minutesToText(entry.waitedMinutes)}
                </span>

                <span>
                  <Clock3 size={15} />
                  Atención {timeLabel(entry.estimatedStartAt)}
                </span>
              </div>

              <div className="queue-ticket-footer">
                <span>Fuente: {ticketSourceLabel(entry.item.source)}</span>
                <span>
                  Espera estimada:{" "}
                  {isNext ? "Casi listo" : minutesToText(entry.estimatedWaitMinutes)}
                </span>
              </div>

              {entry.item.note && (
                <div className="queue-note">
                  <strong>Nota:</strong> {entry.item.note}
                </div>
              )}

              <MediaReferenceList
                items={entry.item.mediaReferences || []}
                title="Referencia del cliente"
              />
            </div>

            <div className="queue-eta-card">
              <strong>
                {isNext
                  ? "Siguiente"
                  : `${minutesToText(entry.estimatedWaitMinutes)}`}
              </strong>
              <span>{timeLabel(entry.estimatedStartAt)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
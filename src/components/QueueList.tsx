import { Clock3, Scissors, Ticket, Timer, UserRound } from "lucide-react";
import type { AppState } from "../types";
import { calculateQueueTimeline, isActiveTicketStatus, ticketSourceLabel, ticketStatusLabel } from "../utils/queueTimeline";
import { minutesToText, timeLabel } from "../utils/time";
import { getTicketClientLabel, getTicketCodeLabel } from "../utils/tickets";
import { EmptyState } from "./EmptyState";
import { MediaReferenceList } from "./MediaReferenceList";

export function QueueList({ state, now = Date.now() }: { state: AppState; now?: number }) {
  const timeline = calculateQueueTimeline(state, now).filter((entry) => isActiveTicketStatus(entry.item.status));

  if (!timeline.length) {
    return <EmptyState title="No hay clientes esperando" text="La lista de espera está libre por ahora." />;
  }

  return (
    <div className="queue-list-pro">
      {timeline.map((entry) => {
        const service = state.services.find((item) => item.id === entry.item.serviceId);
        const barber = entry.assignedBarberSuggestion || "Por asignar";
        const isNext = entry.position === 1;
        const ticketName = getTicketClientLabel(entry.item);
        const ticketCode = getTicketCodeLabel(entry.item);
        const serviceName = service?.name || entry.item.serviceName || "Servicio pendiente";

        return (
          <article className={`queue-ticket-row ${isNext ? "is-next" : ""}`} key={entry.item.id}>
            <div className="queue-rank">
              <span>#{entry.position}</span>
              <small>{isNext ? "Siguiente atención" : "En espera"}</small>
            </div>

            <div className="queue-ticket-main">
              <div className="queue-ticket-head">
                <div>
                  <h4>{ticketName}</h4>
                  <p className="queue-ticket-code">
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
                  Atención estimada: {timeLabel(entry.estimatedStartAt)}
                </span>
              </div>

              <div className="queue-ticket-footer">
                <span>Origen: {ticketSourceLabel(entry.item.source)}</span>
                <span>Tiempo estimado en vivo: {isNext ? "Casi listo" : minutesToText(entry.estimatedWaitMinutes)}</span>
              </div>

              {entry.item.note && (
                <div className="queue-note">
                  <strong>Nota:</strong> {entry.item.note}
                </div>
              )}

              <MediaReferenceList items={entry.item.mediaReferences || []} title="Referencia del cliente" />
            </div>

            <div className="queue-eta-card">
              <strong>{isNext ? "Ahora" : minutesToText(entry.estimatedWaitMinutes)}</strong>
              <span>{timeLabel(entry.estimatedStartAt)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

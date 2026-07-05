import { useMemo } from "react";
import { useLiveNow } from "../hooks/useLiveNow";
import { useAppData } from "../services/localStore";
import { calculateQueueTimeline } from "../utils/queueTimeline";
import { formatElapsed, formatTimeInputLabel, minutesToText } from "../utils/time";
import { getTicketClientLabel, getTicketCodeLabel } from "../utils/tickets";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TvScreenPage() {
  const state = useAppData();
  const now = useLiveNow(30000);

  const timeline = useMemo(() => calculateQueueTimeline(state, now), [state, now]);
  const currentTicket = state.queue.find((item) => item.status === "in_service") || null;
  const currentService = currentTicket ? state.services.find((service) => service.id === currentTicket.serviceId) : null;
  const upcomingTickets = timeline.filter((entry) => entry.item.id !== currentTicket?.id && entry.item.status !== "in_service").slice(0, 5);
  const waitingCount = timeline.filter((entry) => entry.item.status !== "in_service").length;
  const todayAppointments = state.appointments
    .filter((appointment) => appointment.date === todayKey() && !["cancelled", "completed", "no_show"].includes(appointment.status))
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 6);
  const currentBarber = currentTicket?.assignedBarberId
    ? state.barbers.find((barber) => barber.id === currentTicket.assignedBarberId)
    : state.barbers.find((barber) => barber.status === "busy");

  return (
    <div className="tv-screen">
      <header className="tv-header">
        <div>
          <span className="badge badge-warning">Pantalla pública en vivo</span>
          <h1>{state.business.appName}</h1>
          <p>{state.business.address} · {state.business.hours}</p>
        </div>
        <div className="tv-clock">
          <strong>{new Date(now).toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit", hour12: true })}</strong>
          <span>{waitingCount} clientes esperando</span>
        </div>
      </header>

      <main className="tv-grid">
        <section className="tv-current-card">
          <span className="tv-section-label">Atendiendo ahora</span>
          {currentTicket ? (
            <>
              <h2>{getTicketClientLabel(currentTicket)}</h2>
              <p className="tv-ticket-code-main">{getTicketCodeLabel(currentTicket)}</p>
              <div className="tv-current-meta">
                <span>{currentService?.name || currentTicket.serviceName || "Servicio"}</span>
                <span>{currentBarber?.name || "Barbero asignado"}</span>
                <span>Tiempo en servicio: {formatElapsed(currentTicket.serviceStartedAt, now)}</span>
              </div>
            </>
          ) : (
            <>
              <h2>Sin atención activa</h2>
              <p>La siguiente atención aparecerá aquí automáticamente.</p>
            </>
          )}
        </section>

        <section className="tv-panel">
          <div className="tv-panel-head">
            <span className="tv-section-label">Próximos tickets</span>
            <strong>{upcomingTickets.length}</strong>
          </div>

          <div className="tv-ticket-list">
            {upcomingTickets.length ? (
              upcomingTickets.map((entry) => {
                const service = state.services.find((item) => item.id === entry.item.serviceId);

                return (
                  <article className="tv-ticket-row" key={entry.item.id}>
                    <div>
                      <strong>{getTicketClientLabel(entry.item)}</strong>
                      <p>{getTicketCodeLabel(entry.item)}</p>
                      <span>{service?.name || entry.item.serviceName || "Servicio"} · {entry.assignedBarberSuggestion || "Por asignar"}</span>
                    </div>
                    <div className="tv-ticket-side">
                      <strong>#{entry.position}</strong>
                      <span>{entry.estimatedWaitMinutes <= 5 ? "Próximo" : minutesToText(entry.estimatedWaitMinutes)}</span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="tv-empty">No hay tickets pendientes por ahora.</div>
            )}
          </div>
        </section>

        <section className="tv-panel">
          <div className="tv-panel-head">
            <span className="tv-section-label">Citas del día</span>
            <strong>{todayAppointments.length}</strong>
          </div>

          <div className="tv-appointment-list">
            {todayAppointments.length ? (
              todayAppointments.map((appointment) => {
                const barber = state.barbers.find((item) => item.id === appointment.barberId);
                const service = state.services.find((item) => item.id === appointment.serviceId);
                return (
                  <article className="tv-appointment-row" key={appointment.id}>
                    <strong>{formatTimeInputLabel(appointment.time)}</strong>
                    <div>
                      <p>{appointment.clientName || "Cliente"}</p>
                      <span>{service?.name || "Servicio"} · {barber?.name || "Barbero"}</span>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="tv-empty">No hay citas confirmadas para hoy.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

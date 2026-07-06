import type { Appointment, AppState, AppointmentStatus } from "../types";
import { MediaReferenceList } from "./MediaReferenceList";

function appointmentStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    pending: "Pendiente",
    scheduled: "Programada",
    confirmed: "Confirmada",
    checked_in: "Llegó",
    in_service: "En atención",
    completed: "Finalizada",
    no_show: "No llegó",
    cancelled: "Cancelada"
  };
  return labels[status];
}

export function AppointmentCard({
  appointment,
  state,
  action
}: {
  appointment: Appointment;
  state: AppState;
  action?: React.ReactNode;
}) {
  const service = state.services.find((item) => item.id === appointment.serviceId);
  const barber = state.barbers.find((item) => item.id === appointment.barberId);

  return (
    <article className="list-item">
      <div className="queue-number">C</div>
      <div>
        <strong>{appointment.clientName}</strong>
        <p>
          {appointment.date} · {appointment.time} · {service?.name || "Servicio"} · {barber?.name || "Sin barbero"}
        </p>
        <small>Origen: {appointment.source}</small>
        <MediaReferenceList items={appointment.mediaReferences || []} title="Referencia del cliente" />
        {action && <div className="barber-actions">{action}</div>}
      </div>
      <span className="badge badge-success">{appointmentStatusLabel(appointment.status)}</span>
    </article>
  );
}

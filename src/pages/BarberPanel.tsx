import { useMemo, useState } from "react";
import { Clock3, Megaphone, Play, Scissors, SkipForward, SquareCheckBig, Ticket, XCircle } from "lucide-react";
import { AppointmentCard } from "../components/AppointmentCard";
import { BarberCard, barberStatusLabel } from "../components/BarberCard";
import { useAuth } from "../context/AuthContext";
import { useLiveNow } from "../hooks/useLiveNow";
import { approveAppointment, cancelAppointment, startAppointmentNow } from "../services/appointmentService";
import { setBarberStatus } from "../services/barberService";
import { useAppData } from "../services/localStore";
import { callReservedTicket, cancelTicket, finishServiceForBarber, skipTicket, startServiceForBarber, takeNextForBarber } from "../services/queueService";
import { formatElapsed } from "../utils/time";
import { getTicketClientLabel, getTicketCodeLabel } from "../utils/tickets";

export default function BarberPanel() {
  const state = useAppData();
  const { user, role } = useAuth();
  const now = useLiveNow(30000);
  const selectableBarbers = role === "barber" && user?.barberId
    ? state.barbers.filter((barber) => barber.id === user.barberId)
    : state.barbers.filter((barber) => barber.active);
  const [selectedBarberId, setSelectedBarberId] = useState(selectableBarbers[0]?.id || "");
  const [message, setMessage] = useState("");

  const selectedBarber = useMemo(() => {
    return state.barbers.find((barber) => barber.id === selectedBarberId) || selectableBarbers[0];
  }, [state.barbers, selectedBarberId, selectableBarbers]);

  const appointments = state.appointments.filter((appointment) => appointment.barberId === selectedBarber?.id);
  const reservedTicket = state.queue.find((item) => item.assignedBarberId === selectedBarber?.id && ["next", "called"].includes(item.status));
  const currentTicket = selectedBarber?.currentQueueId
    ? state.queue.find((item) => item.id === selectedBarber.currentQueueId)
    : state.queue.find((item) => item.assignedBarberId === selectedBarber?.id && item.status === "in_service");
  const currentService = currentTicket ? state.services.find((service) => service.id === currentTicket.serviceId) : null;

  function safeAction(action: () => void, success: string) {
    try {
      action();
      setMessage(success);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo completar la acción.");
    }
  }

  function canStartAppointmentNow(status: string): boolean {
    return ["scheduled", "confirmed", "checked_in"].includes(status) && !currentTicket;
  }

  if (!selectedBarber) {
    return <div className="panel">No hay barberos configurados.</div>;
  }

  return (
    <div className="dashboard-grid barber-panel-layout">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Panel de barbero</h2>
            <p>Estado, cliente actual, tiempo en servicio y acciones operativas del día.</p>
          </div>
        </div>

        <label>
          Barbero
          <select value={selectedBarber.id} disabled={role === "barber"} onChange={(event) => setSelectedBarberId(event.target.value)}>
            {selectableBarbers.map((barber) => (
              <option value={barber.id} key={barber.id}>{barber.name}</option>
            ))}
          </select>
        </label>

        <div className="barber-panel-hero">
          <div>
            <span className="section-kicker">Barbero activo</span>
            <h3>{selectedBarber.name}</h3>
            <p>Estado actual: {barberStatusLabel(selectedBarber.status)}</p>
          </div>
          <span className={`badge badge-${selectedBarber.status === "available" ? "success" : selectedBarber.status === "busy" ? "danger" : "warning"}`}>
            {barberStatusLabel(selectedBarber.status)}
          </span>
        </div>

        <BarberCard barber={selectedBarber} now={now} />

        <div className="barber-current-card">
          <span className="section-kicker">Cliente actual</span>
          {currentTicket ? (
            <>
              <h4>{getTicketClientLabel(currentTicket)}</h4>
              <p><Ticket size={15} /> {getTicketCodeLabel(currentTicket)}</p>
              <p><Scissors size={15} /> {currentService?.name || currentTicket.serviceName || "Servicio"}</p>
              <p><Clock3 size={15} /> Tiempo en servicio: {formatElapsed(selectedBarber.serviceStartedAt || currentTicket.serviceStartedAt, now)}</p>
            </>
          ) : (
            <p>No hay atención activa en este momento.</p>
          )}
        </div>

        <div className="barber-actions">
          <button className="btn success" onClick={() => safeAction(() => setBarberStatus(selectedBarber.id, "available"), "Estado actualizado a disponible.")}>Disponible</button>
          <button className="btn ghost" onClick={() => safeAction(() => setBarberStatus(selectedBarber.id, "break"), "Estado actualizado a descanso.")}>Descanso</button>
          <button className="btn primary" onClick={() => safeAction(() => takeNextForBarber(selectedBarber.id), "Ticket reservado correctamente.")}>
            <Play size={17} />
            Tomar siguiente
          </button>
          <button className="btn blue" onClick={() => safeAction(() => callReservedTicket(selectedBarber.id), "Cliente llamado correctamente.")}>
            <Megaphone size={17} />
            Llamar
          </button>
          <button className="btn blue" onClick={() => safeAction(() => startServiceForBarber(selectedBarber.id), "Servicio iniciado.")}>
            <Play size={17} />
            Atender
          </button>
          <button className="btn success" onClick={() => safeAction(() => finishServiceForBarber(selectedBarber.id), "Servicio finalizado.")}>
            <SquareCheckBig size={17} />
            Finalizar
          </button>
        </div>

        {reservedTicket && (
          <div className="barber-actions">
            <button className="btn ghost" onClick={() => safeAction(() => skipTicket(reservedTicket.id), "Ticket marcado como saltado.")}>
              <SkipForward size={17} />
              Saltar
            </button>
            <button className="btn danger" onClick={() => safeAction(() => cancelTicket(reservedTicket.id), "Ticket cancelado correctamente.")}>
              <XCircle size={17} />
              Cancelar
            </button>
          </div>
        )}

        {message && <div className="alert info">{message}</div>}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Citas del barbero</h2>
            <p>Solo se muestran citas asignadas a este barbero.</p>
          </div>
        </div>

        <div className="stack">
          {appointments.length ? appointments.map((appointment) => (
            <AppointmentCard
              appointment={appointment}
              state={state}
              key={appointment.id}
              action={
                <>
                  {appointment.status === "pending" && (
                    <button className="btn success" onClick={() => safeAction(() => approveAppointment(appointment.id), "Cita aprobada. Pago validado.")}>
                      <SquareCheckBig size={17} />
                      Aprobar cita
                    </button>
                  )}
                  {canStartAppointmentNow(appointment.status) && (
                    <button className="btn primary" onClick={() => safeAction(() => startAppointmentNow(appointment.id), "Cita enviada a atención.")}>
                      <Play size={17} />
                      Atender ahora
                    </button>
                  )}
                  {!["completed", "cancelled", "no_show"].includes(appointment.status) && (
                    <button className="btn danger" onClick={() => safeAction(() => cancelAppointment(appointment.id), "Cita cancelada correctamente.")}>
                      <XCircle size={17} />
                      Cancelar cita
                    </button>
                  )}
                </>
              }
            />
          )) : <div className="empty-state">Este barbero no tiene citas asignadas.</div>}
        </div>
      </section>
    </div>
  );
}

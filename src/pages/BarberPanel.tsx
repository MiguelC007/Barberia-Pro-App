import { useMemo, useState } from "react";
import { Megaphone, Play, SkipForward, SquareCheckBig, XCircle } from "lucide-react";
import { AppointmentCard } from "../components/AppointmentCard";
import { BarberCard } from "../components/BarberCard";
import { useAuth } from "../context/AuthContext";
import { useLiveNow } from "../hooks/useLiveNow";
import { setBarberStatus } from "../services/barberService";
import { useAppData } from "../services/localStore";
import { callReservedTicket, cancelTicket, finishServiceForBarber, skipTicket, startServiceForBarber, takeNextForBarber } from "../services/queueService";

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

  function safeAction(action: () => void, success: string) {
    try {
      action();
      setMessage(success);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo completar la acción.");
    }
  }

  if (!selectedBarber) {
    return <div className="panel">No hay barberos configurados.</div>;
  }

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Panel de barbero</h2>
            <p>Estado, turnos asignados y atención operativa del día.</p>
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

        <BarberCard barber={selectedBarber} now={now} />

        <div className="actions">
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
          <div className="actions">
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
            <AppointmentCard appointment={appointment} state={state} key={appointment.id} />
          )) : <div className="empty-state">Este barbero no tiene citas asignadas.</div>}
        </div>
      </section>
    </div>
  );
}

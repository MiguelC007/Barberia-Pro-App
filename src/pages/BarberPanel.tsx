import { useMemo, useState } from "react";
import { Play, SquareCheckBig } from "lucide-react";
import { AppointmentCard } from "../components/AppointmentCard";
import { BarberCard } from "../components/BarberCard";
import { useAuth } from "../context/AuthContext";
import { setBarberStatus } from "../services/barberService";
import { useAppData } from "../services/localStore";
import { callNextForBarber, finishServiceForBarber } from "../services/queueService";

export default function BarberPanel() {
  const state = useAppData();
  const { user, role } = useAuth();
  const selectableBarbers = role === "barber" && user?.barberId
    ? state.barbers.filter((barber) => barber.id === user.barberId)
    : state.barbers;
  const [selectedBarberId, setSelectedBarberId] = useState(selectableBarbers[0]?.id || "");
  const [message, setMessage] = useState("");

  const selectedBarber = useMemo(() => {
    return state.barbers.find((barber) => barber.id === selectedBarberId) || selectableBarbers[0];
  }, [state.barbers, selectedBarberId, selectableBarbers]);

  const appointments = state.appointments.filter((appointment) => appointment.barberId === selectedBarber?.id);

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
            <p>Acceso limitado para estado, citas asignadas y atención de clientes.</p>
          </div>
        </div>

        <label>
          Barbero
          <select
            value={selectedBarber.id}
            disabled={role === "barber"}
            onChange={(event) => setSelectedBarberId(event.target.value)}
          >
            {selectableBarbers.map((barber) => (
              <option value={barber.id} key={barber.id}>{barber.name}</option>
            ))}
          </select>
        </label>

        <BarberCard barber={selectedBarber} />

        <div className="actions">
          <button className="btn success" onClick={() => safeAction(() => setBarberStatus(selectedBarber.id, "available"), "Estado actualizado.")}>Disponible</button>
          <button className="btn ghost" onClick={() => safeAction(() => setBarberStatus(selectedBarber.id, "break"), "Estado actualizado.")}>Descanso</button>
          <button className="btn primary" onClick={() => safeAction(() => callNextForBarber(selectedBarber.id), "Siguiente cliente tomado.")}>
            <Play size={17} />
            Tomar siguiente
          </button>
          <button className="btn blue" onClick={() => safeAction(() => finishServiceForBarber(selectedBarber.id), "Servicio finalizado.")}>
            <SquareCheckBig size={17} />
            Finalizar
          </button>
        </div>

        {message && <div className="alert info">{message}</div>}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Citas del barbero</h2>
            <p>Solo citas asignadas a este barbero.</p>
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

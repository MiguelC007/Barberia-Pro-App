import { useEffect, useMemo, useState } from "react";
import { Play, Plus, SquareCheckBig, Trash2 } from "lucide-react";
import { BarberCard } from "../components/BarberCard";
import { QueueList } from "../components/QueueList";
import { RoleGuard } from "../context/RoleGuard";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../services/localStore";
import {
  callNextForBarber,
  createManualTicket,
  createQueueItem,
  finishServiceForBarber,
  removeDoneQueueItems
} from "../services/queueService";
import { calculateQueueTimeline } from "../utils/queueTimeline";
import { formatElapsed, minutesToText } from "../utils/time";

export default function QueuePage() {
  const state = useAppData();
  const { user } = useAuth();
  const [clientName, setClientName] = useState(user?.role === "guest" ? "" : user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [serviceId, setServiceId] = useState(state.services.find((service) => service.active)?.id || "");
  const [barberId, setBarberId] = useState("");
  const [note, setNote] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualServiceId, setManualServiceId] = useState(state.services.find((service) => service.active)?.id || "");
  const [manualBarberId, setManualBarberId] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeline = useMemo(() => calculateQueueTimeline(state, now), [state, now]);
  const activeService = useMemo(() => {
    return state.barbers.find((barber) => barber.status === "busy");
  }, [state.barbers, now]);
  const nextWait = timeline[0]?.estimatedWaitMinutes || 0;

  function handleJoinQueue() {
    try {
      const service = serviceId || state.services.find((item) => item.active)?.id;
      if (!service) throw new Error("No hay servicios activos.");

      const ticket = createQueueItem({
        clientName: clientName || user?.name || "Cliente",
        clientPhone: phone,
        serviceId: service,
        preferredBarberId: barberId || undefined,
        note,
        session: user
      });
      setClientName(user?.role === "guest" ? "" : user?.name || "");
      setPhone(user?.phone || "");
      setNote("");
      setMessage(`Turno creado: ${ticket.ticketCode || ticket.id}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo tomar turno.");
    }
  }

  function handleManualTicket() {
    try {
      const ticket = createManualTicket({
        clientName: manualName,
        serviceId: manualServiceId || undefined,
        preferredBarberId: manualBarberId || undefined,
        note: manualNote,
        session: user
      });
      setManualName("");
      setManualNote("");
      setMessage(`Cliente manual agregado: ${ticket.ticketCode || ticket.id}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo agregar el cliente manual.");
    }
  }

  function handleCallNext(selectedBarberId?: string) {
    try {
      const targetBarber = selectedBarberId || user?.barberId || state.barbers.find((barber) => barber.status === "available")?.id;
      if (!targetBarber) throw new Error("No hay barbero disponible.");
      callNextForBarber(targetBarber);
      setMessage("Siguiente cliente tomado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo tomar el siguiente.");
    }
  }

  function handleFinish(selectedBarberId?: string) {
    try {
      const targetBarber = selectedBarberId || user?.barberId || activeService?.id;
      if (!targetBarber) throw new Error("No hay servicio activo.");
      finishServiceForBarber(targetBarber);
      setMessage("Servicio finalizado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo finalizar.");
    }
  }

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Turnos de entrada</h2>
            <p>Toma tu turno al llegar y te atenderemos en orden.</p>
          </div>
          <span className="badge badge-warning">{new Date(now).toLocaleTimeString("es-HN")}</span>
        </div>

        <div className="stats-grid compact-stats">
          <div className="stat-card">
            <strong>{timeline.length}</strong>
            <span>Activos</span>
          </div>
          <div className="stat-card">
            <strong>{minutesToText(nextWait)}</strong>
            <span>Espera aprox.</span>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Nombre
            <input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Nombre del cliente" />
          </label>
          <label>
            WhatsApp
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="50400000000" />
          </label>
          <label>
            Servicio
            <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              {state.services.filter((service) => service.active).map((service) => (
                <option value={service.id} key={service.id}>{service.name} - {service.duration} min</option>
              ))}
            </select>
          </label>
          <label>
            Barbero preferido
            <select value={barberId} onChange={(event) => setBarberId(event.target.value)}>
              <option value="">Cualquiera disponible</option>
              {state.barbers.filter((barber) => barber.active).map((barber) => (
                <option value={barber.id} key={barber.id}>{barber.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Nota
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej. corte bajo, barba perfilada" />
        </label>

        <div className="actions">
          <button className="btn primary" onClick={handleJoinQueue}>Tomar turno</button>
          <RoleGuard allowed={["barber", "owner", "super_admin"]}>
            <button className="btn blue" onClick={() => handleCallNext()}>
              <Play size={17} />
              Tomar siguiente
            </button>
            <button className="btn success" onClick={() => handleFinish()}>
              <SquareCheckBig size={17} />
              Finalizar servicio
            </button>
            <button className="btn ghost" onClick={removeDoneQueueItems}>
              <Trash2 size={17} />
              Limpiar cerrados
            </button>
          </RoleGuard>
        </div>

        {message && <div className="alert info">{message}</div>}

        <RoleGuard allowed={["barber", "owner", "super_admin"]}>
          <div className="divider" />
          <div className="section-heading">
            <div>
              <h3>Agregar cliente manual</h3>
              <p>Para clientes que no usan celular o solo dan su nombre.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Nombre obligatorio
              <input value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="Ej. Yair" />
            </label>
            <label>
              Servicio opcional
              <select value={manualServiceId} onChange={(event) => setManualServiceId(event.target.value)}>
                {state.services.filter((service) => service.active).map((service) => (
                  <option value={service.id} key={service.id}>{service.name}</option>
                ))}
              </select>
            </label>
            <label>
              Barbero preferido
              <select value={manualBarberId} onChange={(event) => setManualBarberId(event.target.value)}>
                <option value="">Cualquiera disponible</option>
                {state.barbers.filter((barber) => barber.active).map((barber) => (
                  <option value={barber.id} key={barber.id}>{barber.name}</option>
                ))}
              </select>
            </label>
            <label>
              Nota opcional
              <input value={manualNote} onChange={(event) => setManualNote(event.target.value)} placeholder="Referencia breve" />
            </label>
          </div>
          <button className="btn blue" onClick={handleManualTicket}>
            <Plus size={17} />
            Agregar cliente manual
          </button>
        </RoleGuard>

        <div className="divider" />
        <QueueList state={state} />
      </section>

      <aside className="stack">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Servicio activo</h3>
              <p>Contador en vivo del barbero ocupado.</p>
            </div>
          </div>

          <div className="timer-box">
            <strong>{formatElapsed(activeService?.serviceStartedAt)}</strong>
            <span>{activeService ? `${activeService.currentClientName} con ${activeService.name}` : "Nadie esta siendo atendido"}</span>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Barberos</h3>
              <p>Disponibles, ocupados o en descanso.</p>
            </div>
          </div>

          <div className="stack">
            {state.barbers.filter((barber) => barber.active).map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

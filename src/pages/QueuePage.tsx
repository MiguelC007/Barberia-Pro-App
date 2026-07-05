import { useMemo, useState } from "react";
import { Megaphone, Play, Plus, SkipForward, SquareCheckBig, Trash2, XCircle } from "lucide-react";
import { BarberCard } from "../components/BarberCard";
import { QueueList } from "../components/QueueList";
import { TicketCard } from "../components/TicketCard";
import { RoleGuard } from "../context/RoleGuard";
import { useAuth } from "../context/AuthContext";
import { useLiveNow } from "../hooks/useLiveNow";
import { useAppData } from "../services/localStore";
import {
  callReservedTicket,
  cancelTicket,
  createManualTicket,
  createQueueItem,
  finishServiceForBarber,
  getActiveTicket,
  removeDoneQueueItems,
  skipTicket,
  startServiceForBarber,
  takeNextForBarber
} from "../services/queueService";
import { calculateQueueTimeline } from "../utils/queueTimeline";
import { canOperateQueue } from "../utils/permissions";
import { formatElapsed, minutesToText } from "../utils/time";

export default function QueuePage() {
  const state = useAppData();
  const { user, role } = useAuth();
  const now = useLiveNow(30000);
  const canOperate = canOperateQueue(role);
  const [clientName, setClientName] = useState(user?.role === "guest" ? "" : user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [serviceId, setServiceId] = useState(state.services.find((service) => service.active)?.id || "");
  const [barberId, setBarberId] = useState("");
  const [note, setNote] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualServiceId, setManualServiceId] = useState(state.services.find((service) => service.active)?.id || "");
  const [manualBarberId, setManualBarberId] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [message, setMessage] = useState("");

  const timeline = useMemo(() => calculateQueueTimeline(state, now), [state, now]);
  const activeService = useMemo(() => state.barbers.find((barber) => barber.status === "busy"), [state.barbers]);
  const nextWait = timeline[0]?.estimatedWaitMinutes || 0;
  const ownTicket = getActiveTicket();
  const currentBarberId =
    role === "barber" ? user?.barberId || "" : barberId || state.barbers.find((barber) => barber.status === "available")?.id || "";
  const selectedOperationalTicket = currentBarberId
    ? state.queue.find((item) => item.assignedBarberId === currentBarberId && ["next", "called"].includes(item.status))
    : null;

  function handleJoinQueue() {
    try {
      const service = serviceId || state.services.find((item) => item.active)?.id;
      if (!service) throw new Error("No hay servicios activos.");

      const ticket = createQueueItem({
        clientName: clientName || user?.name || "",
        clientPhone: phone,
        serviceId: service,
        preferredBarberId: barberId || undefined,
        note,
        session: user
      });
      setClientName(user?.role === "guest" ? "" : user?.name || "");
      setPhone(user?.phone || "");
      setNote("");
      setMessage(`Ticket generado correctamente: ${ticket.ticketCode || ticket.id}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo registrar el turno.");
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
      setMessage(`Cliente agregado correctamente: ${ticket.ticketCode || ticket.id}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo agregar el cliente manual.");
    }
  }

  function runAction(action: () => void, success: string) {
    try {
      action();
      setMessage(success);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo completar la acción.");
    }
  }

  if (!canOperate) {
    return (
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Mi ticket</h2>
              <p>Consulta tu ticket activo, tu posición y el tiempo estimado en vivo.</p>
            </div>
          </div>

          {ownTicket ? (
            <TicketCard item={ownTicket} state={state} now={now} />
          ) : (
            <div className="empty-state">Aún no tienes un ticket activo. Puedes tomar uno desde esta página o desde el QR.</div>
          )}

          <div className="divider" />

          <div className="form-grid">
            <label>
              Nombre
              <input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Opcional" />
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

          <button className="btn primary" onClick={handleJoinQueue}>Tomar turno</button>
          {message && <div className="alert info">{message}</div>}
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Lista de espera</h2>
            <p>Atención por turno con seguimiento en vivo para recepción, barbero y cliente.</p>
          </div>
        </div>

        <div className="stats-grid compact-stats">
          <div className="stat-card">
            <strong>{timeline.length}</strong>
            <span>Turnos activos</span>
          </div>
          <div className="stat-card">
            <strong>{minutesToText(nextWait)}</strong>
            <span>Tiempo estimado en vivo</span>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Barbero operativo
            <select value={barberId} onChange={(event) => setBarberId(event.target.value)} disabled={role === "barber"}>
              <option value="">Selecciona un barbero</option>
              {state.barbers.filter((barber) => barber.active).map((barber) => (
                <option value={barber.id} key={barber.id}>{barber.name}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="actions">
          <button className="btn primary" onClick={() => runAction(() => takeNextForBarber(currentBarberId), "Ticket reservado para atención.")}>
            <Play size={17} />
            Tomar siguiente
          </button>
          <button className="btn blue" onClick={() => runAction(() => callReservedTicket(currentBarberId), "Cliente llamado correctamente.")}>
            <Megaphone size={17} />
            Llamar
          </button>
          <button className="btn success" onClick={() => runAction(() => startServiceForBarber(currentBarberId), "Servicio iniciado.")}>
            <Play size={17} />
            Atender
          </button>
          <button className="btn success" onClick={() => runAction(() => finishServiceForBarber(currentBarberId), "Servicio finalizado.")}>
            <SquareCheckBig size={17} />
            Finalizar
          </button>
          <button className="btn ghost" onClick={removeDoneQueueItems}>
            <Trash2 size={17} />
            Limpiar cerrados
          </button>
        </div>

        {selectedOperationalTicket && (
          <div className="actions">
            <button className="btn ghost" onClick={() => runAction(() => skipTicket(selectedOperationalTicket.id), "Ticket marcado como saltado.")}>
              <SkipForward size={17} />
              Saltar ticket
            </button>
            <button className="btn danger" onClick={() => runAction(() => cancelTicket(selectedOperationalTicket.id), "Ticket cancelado correctamente.")}>
              <XCircle size={17} />
              Cancelar ticket
            </button>
          </div>
        )}

        {message && <div className="alert info">{message}</div>}

        <RoleGuard allowed={["barber", "owner", "super_admin"]}>
          <div className="divider" />
          <div className="section-heading">
            <div>
              <h3>Agregar cliente manual</h3>
              <p>Para clientes que no usan celular o necesitan asistencia en recepción.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Nombre obligatorio
              <input value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder="Ej. Yair" />
            </label>
            <label>
              Servicio
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
              Nota
              <input value={manualNote} onChange={(event) => setManualNote(event.target.value)} placeholder="Referencia breve" />
            </label>
          </div>
          <button className="btn blue" onClick={handleManualTicket}>
            <Plus size={17} />
            Agregar cliente manual
          </button>
        </RoleGuard>

        <div className="divider" />
        <QueueList state={state} now={now} />
      </section>

      <aside className="stack">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Servicio activo</h3>
              <p>Tiempo en servicio actualizado en vivo.</p>
            </div>
          </div>

          <div className="timer-box">
            <strong>{formatElapsed(activeService?.serviceStartedAt, now)}</strong>
            <span>
              {activeService
                ? `${activeService.currentClientName || "Cliente por confirmar"} con ${activeService.name}`
                : "No hay atención activa en este momento."}
            </span>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <h3>Barberos</h3>
              <p>
                {state.barbers.some((barber) => barber.active && barber.status === "available")
                  ? "Disponibles, ocupados o en descanso."
                  : "Todos los barberos están ocupados. Te atenderemos por orden de llegada."}
              </p>
            </div>
          </div>

          <div className="stack">
            {state.barbers.filter((barber) => barber.active).map((barber) => (
              <BarberCard key={barber.id} barber={barber} now={now} />
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

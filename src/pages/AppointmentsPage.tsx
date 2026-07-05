import { useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { AppointmentCard } from "../components/AppointmentCard";
import { EmptyState } from "../components/EmptyState";
import { MediaCapturePanel } from "../components/MediaCapturePanel";
import { MediaReferenceList } from "../components/MediaReferenceList";
import { useAuth } from "../context/AuthContext";
import { createAppointment, suggestAppointmentTimes } from "../services/appointmentService";
import { attachMediaToAppointment } from "../services/mediaService";
import { useAppData } from "../services/localStore";
import type { MediaReference } from "../types";
import { canViewAllAppointments } from "../utils/permissions";
import { currentTimeInputValue, minutesToText, nextAppointmentDateInputValue } from "../utils/time";

export default function AppointmentsPage() {
  const state = useAppData();
  const { user, role } = useAuth();
  const [clientName, setClientName] = useState(user?.role === "guest" ? "" : user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [serviceId, setServiceId] = useState(state.services.find((service) => service.active)?.id || "");
  const [barberId, setBarberId] = useState(user?.barberId || "");
  const [date, setDate] = useState(nextAppointmentDateInputValue());
  const [time, setTime] = useState(currentTimeInputValue());
  const [message, setMessage] = useState("");
  const [pendingMedia, setPendingMedia] = useState<MediaReference[]>([]);

  const visibleAppointments = useMemo(() => {
    if (canViewAllAppointments(role)) return state.appointments;
    if (role === "barber" && user?.barberId) return state.appointments.filter((item) => item.barberId === user.barberId);
    return state.appointments.filter((item) => item.clientId === user?.id || item.clientName.toLowerCase() === user?.name.toLowerCase());
  }, [role, state.appointments, user]);

  const selectedService = state.services.find((service) => service.id === serviceId);
  const slots = useMemo(() => {
    if (!date || !serviceId) return [];
    return suggestAppointmentTimes({
      date,
      serviceId,
      barberId: barberId || undefined,
      limit: 6
    });
  }, [date, serviceId, barberId, state.queue, state.appointments, state.barbers]);

  function pickSlot(slot: { barberId: string; time: string }) {
    setBarberId(slot.barberId);
    setTime(slot.time);
    setMessage("");
  }

  function handleCreate() {
    try {
      const selectedSlot = slots.find((slot) => slot.time === time && (!barberId || slot.barberId === barberId));
      const finalBarberId = barberId || selectedSlot?.barberId;

      if (!serviceId || !finalBarberId) {
        throw new Error("Selecciona servicio y un horario sugerido.");
      }

      const appointment = createAppointment({
        clientName,
        clientPhone: phone,
        serviceId,
        barberId: finalBarberId,
        date,
        time,
        source: role === "client" || role === "guest" ? "client" : "manual",
        session: user
      });

      if (pendingMedia.length) {
        attachMediaToAppointment(appointment.id, pendingMedia);
        setPendingMedia([]);
      }

      setMessage("Cita guardada correctamente.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo guardar la cita.");
    }
  }

  async function addPendingMedia(media: MediaReference[]) {
    setPendingMedia((current) => [...current, ...media]);
  }

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Agendar cita</h2>
            <p>Reserva un horario sin chocar con turnos activos ni citas ya programadas.</p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            Nombre
            <input value={clientName} onChange={(event) => setClientName(event.target.value)} />
          </label>
          <label>
            WhatsApp
            <input value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label>
            Servicio
            <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
              {state.services.filter((service) => service.active).map((service) => (
                <option value={service.id} key={service.id}>{service.name}</option>
              ))}
            </select>
          </label>
          <label>
            Barbero
            <select value={barberId} onChange={(event) => setBarberId(event.target.value)}>
              <option value="">Cualquiera disponible</option>
              {state.barbers.filter((barber) => barber.active).map((barber) => (
                <option value={barber.id} key={barber.id}>{barber.name}</option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>
            Hora
            <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
          </label>
        </div>

        <section className="availability-box">
          <div className="section-heading">
            <div>
              <h3>Horarios sugeridos</h3>
              <p>{selectedService ? `${selectedService.name} dura aprox. ${selectedService.duration} min.` : "Selecciona un servicio."}</p>
            </div>
            <CalendarCheck />
          </div>

          {slots.length ? (
            <div className="slot-grid">
              {slots.map((slot) => (
                <button className="slot-button" key={`${slot.barberId}-${slot.time}`} onClick={() => pickSlot(slot)}>
                  <strong>{slot.time}</strong>
                  <span>{slot.barberName}</span>
                  <small>{slot.peopleBefore} antes · {minutesToText(slot.waitMinutes)}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">No hay horarios disponibles para esta selección.</div>
          )}
        </section>

        <div className="divider" />
        <MediaCapturePanel onAdd={addPendingMedia} labels={{ photo: "Tomar foto", video: "Grabar video", file: "Subir referencia" }} />
        <MediaReferenceList items={pendingMedia} title="Referencia para la cita" />

        <button className="btn primary" onClick={handleCreate}>Confirmar cita</button>
        {message && <div className="alert info">{message}</div>}
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Citas visibles</h2>
            <p>Administración ve todas, barbero solo las asignadas y cliente únicamente las propias.</p>
          </div>
        </div>

        <div className="stack">
          {visibleAppointments.length ? (
            visibleAppointments.map((appointment) => (
              <AppointmentCard appointment={appointment} state={state} key={appointment.id} />
            ))
          ) : (
            <EmptyState title="No hay citas visibles" text="Agenda una cita para verla aquí." />
          )}
        </div>
      </section>
    </div>
  );
}

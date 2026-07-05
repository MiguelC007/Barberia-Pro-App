import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { MediaCapturePanel } from "../components/MediaCapturePanel";
import { MediaReferenceList } from "../components/MediaReferenceList";
import { TicketCard } from "../components/TicketCard";
import { createQueueTicket, getActiveTicket, updateTicketDetails } from "../services/queueService";
import { attachMediaToTicket } from "../services/mediaService";
import { useAppData } from "../services/localStore";
import type { MediaReference } from "../types";

export default function TicketEntryPage() {
  const state = useAppData();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("Cliente");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState(state.services.find((service) => service.active)?.id || "");
  const [preferredBarberId, setPreferredBarberId] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      const firstServiceId = state.services.find((service) => service.active)?.id;
      const existing = getActiveTicket();
      const ticket = existing || createQueueTicket({
        clientName: "Cliente",
        serviceId: firstServiceId,
        source: "qr",
        reuseDeviceTicket: true
      });
      setTicketId(ticket.id);
      setClientName(ticket.clientName);
      setPhone(ticket.clientPhone || ticket.whatsapp || "");
      setServiceId(ticket.serviceId);
      setPreferredBarberId(ticket.preferredBarberId || "");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo crear tu turno.");
    }
  }, [state.services]);

  const ticket = useMemo(() => {
    return state.queue.find((item) => item.id === ticketId) || getActiveTicket();
  }, [state.queue, ticketId, now]);

  function saveDetails() {
    if (!ticket) return;
    try {
      updateTicketDetails(ticket.id, {
        clientName,
        clientPhone: phone,
        serviceId,
        preferredBarberId: preferredBarberId || null
      });
      setMessage("Turno actualizado.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo actualizar el turno.");
    }
  }

  async function addReference(media: MediaReference[]) {
    if (!ticket) return;
    attachMediaToTicket(ticket.id, media);
    setMessage("Referencia agregada al turno.");
  }

  return (
    <div className="public-ticket-screen">
      <section className="public-ticket-hero">
        <span className="badge badge-warning">Spencer Barber Shop</span>
        <h1>Tu turno de entrada</h1>
        <p>Toma tu turno al llegar y te atenderemos en orden.</p>
      </section>

      <main className="public-ticket-layout">
        {ticket ? (
          <TicketCard item={ticket} state={state} />
        ) : (
          <div className="panel">
            <h2>Preparando tu turno</h2>
            <p>{message || "Un momento por favor."}</p>
          </div>
        )}

        {ticket && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Detalles del servicio</h2>
                <p>Completa solo lo necesario para ayudarte mejor.</p>
              </div>
            </div>

            <div className="form-grid">
              <label>
                Nombre
                <input value={clientName} onChange={(event) => setClientName(event.target.value)} />
              </label>
              <label>
                WhatsApp opcional
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="50400000000" />
              </label>
              <label>
                Servicio
                <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
                  {state.services.filter((service) => service.active).map((service) => (
                    <option value={service.id} key={service.id}>
                      {service.name} - {service.duration} min
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Barbero preferido
                <select value={preferredBarberId} onChange={(event) => setPreferredBarberId(event.target.value)}>
                  <option value="">Cualquiera disponible</option>
                  {state.barbers.filter((barber) => barber.active).map((barber) => (
                    <option value={barber.id} key={barber.id}>
                      {barber.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button className="btn primary full" onClick={saveDetails}>
              <Save size={17} />
              Actualizar turno
            </button>
            <div className="divider" />
            <MediaCapturePanel onAdd={addReference} labels={{ photo: "Tomar foto", video: "Grabar video", file: "Subir referencia" }} />
            <MediaReferenceList items={ticket.mediaReferences || []} title="Referencia del cliente" />
            {message && <div className="alert info">{message}</div>}
          </section>
        )}
      </main>
    </div>
  );
}

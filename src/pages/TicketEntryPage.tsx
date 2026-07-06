import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, Save, Share2 } from "lucide-react";
import { MediaCapturePanel } from "../components/MediaCapturePanel";
import { MediaReferenceList } from "../components/MediaReferenceList";
import { TicketCard } from "../components/TicketCard";
import { useLiveNow } from "../hooks/useLiveNow";
import { createQueueTicket, getActiveTicket, updateTicketDetails } from "../services/queueService";
import { attachMediaToTicket } from "../services/mediaService";
import { useAppData } from "../services/localStore";
import type { MediaReference } from "../types";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isIosDevice(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneMode(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
}

export default function TicketEntryPage() {
  const state = useAppData();
  const now = useLiveNow(30000);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState(state.services.find((service) => service.active)?.id || "");
  const [preferredBarberId, setPreferredBarberId] = useState("");
  const [message, setMessage] = useState("");
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsInstalled(isStandaloneMode());
    setIsIos(isIosDevice());

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    }

    function handleAppInstalled() {
      setInstallPrompt(null);
      setIsInstalled(true);
      setMessage("App instalada correctamente. Ya puedes abrirla desde tu pantalla principal.");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    try {
      const firstServiceId = state.services.find((service) => service.active)?.id;
      const existing = getActiveTicket();
      const ticket =
        existing ||
        createQueueTicket({
          clientName: "",
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
      setMessage(err instanceof Error ? err.message : "No se pudo generar tu ticket.");
    }
  }, [state.services]);

  const ticket = useMemo(() => state.queue.find((item) => item.id === ticketId) || getActiveTicket(), [state.queue, ticketId]);
  const webUrl = useMemo(() => `${window.location.origin}/turno`, []);

  async function installApp() {
    if (!installPrompt) {
      setMessage(
        isIos
          ? "En iPhone toca Compartir y luego Agregar a pantalla de inicio."
          : "Si no aparece la instalación, usa Abrir versión web y guarda la página desde el menú del navegador."
      );
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function saveDetails() {
    if (!ticket) return;
    try {
      updateTicketDetails(ticket.id, {
        clientName,
        clientPhone: phone,
        serviceId,
        preferredBarberId: preferredBarberId || null
      });
      setMessage("Tus datos quedaron actualizados correctamente.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo actualizar el ticket.");
    }
  }

  async function addReference(media: MediaReference[]) {
    if (!ticket) return;
    attachMediaToTicket(ticket.id, media);
    setMessage("Referencia agregada al ticket.");
  }

  return (
    <div className="public-ticket-screen">
      <section className="public-ticket-hero">
        <span className="badge badge-warning">Ingreso por QR</span>
        <h1>Tu ticket de atención</h1>
        <p>Tu turno se crea automáticamente al escanear. Completa solo los datos necesarios.</p>
      </section>

      <main className="public-ticket-layout">
        {ticket ? (
          <TicketCard item={ticket} state={state} now={now} />
        ) : (
          <div className="panel">
            <h2>Preparando tu ticket</h2>
            <p>{message || "Un momento, por favor."}</p>
          </div>
        )}

        {ticket && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <h2>Datos del servicio</h2>
                <p>Actualiza tu nombre, WhatsApp, servicio y barbero preferido si lo deseas.</p>
              </div>
            </div>

            {!isInstalled && (
              <>
                <div className="alert info">
                  <strong>Instala Spencer Barber Shop</strong>
                  <p>
                    Guarda esta app en tu celular para ver tu ticket y volver a entrar rápido cuando visites la barbería.
                  </p>
                  {isIos && (
                    <p>
                      En iPhone toca <strong>Compartir</strong> y luego <strong>Agregar a pantalla de inicio</strong>.
                    </p>
                  )}
                </div>

                <div className="form-grid">
                  <button className="btn primary full" onClick={installApp} type="button">
                    {isIos ? <Share2 size={17} /> : <Download size={17} />}
                    {isIos ? "Cómo instalar en iPhone" : "Instalar app"}
                  </button>
                  <a className="btn ghost full" href={webUrl}>
                    <ExternalLink size={17} />
                    Abrir versión web
                  </a>
                </div>

                <div className="divider" />
              </>
            )}

            <div className="form-grid">
              <label>
                Nombre
                <input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Opcional" />
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
              Guardar datos del ticket
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

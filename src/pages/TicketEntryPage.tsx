import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ExternalLink, Save, Share2 } from "lucide-react";
import { TicketCard } from "../components/TicketCard";
import { useLiveNow } from "../hooks/useLiveNow";
import { createQueueTicket, getActiveTicket, updateTicketDetails } from "../services/queueService";
import { useAppData } from "../services/localStore";
import { isActiveTicketStatus, isClosedTicketStatus, normalizeTicketStatus } from "../utils/queueTimeline";
import { getTicketClientLabel, getTicketCodeLabel } from "../utils/tickets";

const ACTIVE_TICKET_KEY = "spencer_barber_shop_active_ticket_v1";
const LAST_CALL_NOTICE_KEY = "spencer_barber_shop_last_call_notice_v1";

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

function clearSavedActiveTicket(ticketId?: string | null): void {
  const current = localStorage.getItem(ACTIVE_TICKET_KEY);
  if (!ticketId || current === ticketId) {
    localStorage.removeItem(ACTIVE_TICKET_KEY);
  }
}

function playCallBeep(): void {
  try {
    const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.35);
  } catch {
    // Algunos navegadores bloquean audio automático si el cliente no interactuó con la página.
  }
}

function announceCall(message: string): void {
  if ("vibrate" in navigator) {
    navigator.vibrate([250, 120, 250]);
  }

  playCallBeep();

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "es-HN";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  }
}

export default function TicketEntryPage() {
  const state = useAppData();
  const now = useLiveNow(30000);
  const creatingTicketRef = useRef(false);
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

  const ticket = useMemo(() => state.queue.find((item) => item.id === ticketId) || getActiveTicket(), [state.queue, ticketId]);
  const webUrl = useMemo(() => window.location.origin, []);

  useEffect(() => {
    if (!state.services.some((service) => service.active) || creatingTicketRef.current) return;

    try {
      const existing = getActiveTicket();
      if (existing && isActiveTicketStatus(existing.status)) {
        setTicketId(existing.id);
        setClientName(existing.clientName);
        setPhone(existing.clientPhone || existing.whatsapp || "");
        setServiceId(existing.serviceId);
        setPreferredBarberId(existing.preferredBarberId || "");
        return;
      }

      if (existing && isClosedTicketStatus(normalizeTicketStatus(existing.status))) {
        clearSavedActiveTicket(existing.id);
      }

      const firstServiceId = state.services.find((service) => service.active)?.id;
      creatingTicketRef.current = true;
      const newTicket = createQueueTicket({
        clientName: "",
        serviceId: firstServiceId,
        source: "qr",
        reuseDeviceTicket: true
      });

      setTicketId(newTicket.id);
      setClientName(newTicket.clientName);
      setPhone(newTicket.clientPhone || newTicket.whatsapp || "");
      setServiceId(newTicket.serviceId);
      setPreferredBarberId(newTicket.preferredBarberId || "");
      creatingTicketRef.current = false;
    } catch (err) {
      creatingTicketRef.current = false;
      setMessage(err instanceof Error ? err.message : "No se pudo generar tu ticket.");
    }
  }, [state.services, state.queue]);

  useEffect(() => {
    if (!ticket) return;
    const status = normalizeTicketStatus(ticket.status);

    if (isClosedTicketStatus(status)) {
      clearSavedActiveTicket(ticket.id);
      setTicketId(null);
      setMessage("Tu atención fue finalizada. Puedes escanear nuevamente para tomar otro turno.");
      return;
    }

    if (!["next", "called", "in_service"].includes(status)) return;

    const noticeId = `${ticket.id}-${ticket.calledAt || ticket.startedAt || status}`;
    if (localStorage.getItem(LAST_CALL_NOTICE_KEY) === noticeId) return;

    localStorage.setItem(LAST_CALL_NOTICE_KEY, noticeId);
    const barber = state.barbers.find((item) => item.id === ticket.assignedBarberId);
    const barberText = barber ? `con ${barber.name}` : "con tu barbero";
    const clientText = getTicketClientLabel(ticket);
    const codeText = getTicketCodeLabel(ticket);
    announceCall(`${clientText}, ticket ${codeText}, pasa ${barberText}.`);
    setMessage(`${clientText}, te están llamando. Pasa ${barberText}.`);
  }, [ticket, state.barbers]);

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

            {message && <div className="alert info">{message}</div>}
          </section>
        )}
      </main>
    </div>
  );
}

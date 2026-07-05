import { useState } from "react";
import { Bot, Send } from "lucide-react";
import { MediaCapturePanel } from "../components/MediaCapturePanel";
import { MediaReferenceList } from "../components/MediaReferenceList";
import { useAuth } from "../context/AuthContext";
import { createAppointment, suggestAppointmentTimes } from "../services/appointmentService";
import { attachMediaToAppointment, attachMediaToTicket } from "../services/mediaService";
import { useAppData } from "../services/localStore";
import { getActiveTicket } from "../services/queueService";
import type { Appointment, MediaReference } from "../types";
import { nextAppointmentDateInputValue } from "../utils/time";

type ChatMessage = {
  from: "bot" | "user";
  text: string;
  media?: MediaReference[];
};

export default function ChatBotPage() {
  const state = useAppData();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: "bot", text: "Hola. Puedo ayudarte con precios, recomendaciones o una cita." }
  ]);
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<Omit<Appointment, "id" | "createdAt" | "status"> | null>(null);
  const [draftMedia, setDraftMedia] = useState<MediaReference[]>([]);

  function pushBot(text: string, media?: MediaReference[]) {
    setMessages((current) => {
      const lastBot = [...current].reverse().find((message) => message.from === "bot");
      if (lastBot?.text === text) return current;
      return [...current, { from: "bot", text, media }];
    });
  }

  function parseIntent(text: string) {
    const lower = text.toLowerCase();
    const wantsAppointment = /(cita|agendar|reservar|turno para|horario)/.test(lower);
    const asksPrice = /(precio|cuanto|costa)/.test(lower);
    const asksRecommendation = /(recomienda|recomendacion|recomendar|corte me queda|look)/.test(lower);

    const service =
      lower.includes("barba")
        ? state.services.find((item) => item.name.toLowerCase().includes("barba"))
        : lower.includes("fade") || lower.includes("degradado")
          ? state.services.find((item) => item.name.toLowerCase().includes("fade") || item.name.toLowerCase().includes("degradado"))
          : lower.includes("ceja")
            ? state.services.find((item) => item.name.toLowerCase().includes("ceja"))
            : lower.includes("clasico") || lower.includes("corte")
              ? state.services.find((item) => item.name.toLowerCase().includes("clasico") || item.name.toLowerCase().includes("corte"))
              : null;

    const barber = state.barbers.find((item) => lower.includes(item.name.toLowerCase())) || null;
    const date = lower.includes("manana") ? nextAppointmentDateInputValue(0) : nextAppointmentDateInputValue();

    return {
      wantsAppointment,
      asksPrice,
      asksRecommendation,
      service: service || null,
      barber,
      date
    };
  }

  function sendMessage() {
    if (!input.trim()) return;

    const userText = input.trim();
    const parsed = parseIntent(userText);
    setMessages((current) => [...current, { from: "user", text: userText }]);
    setInput("");

    if (parsed.asksPrice && parsed.service) {
      pushBot(`${parsed.service.name} cuesta L${parsed.service.price} y dura aprox. ${parsed.service.duration} min.`);
      return;
    }

    if (parsed.asksRecommendation) {
      pushBot("Si quieres algo limpio y facil de mantener, te recomiendo un corte clasico o un fade segun el largo que uses arriba.");
      return;
    }

    if (!parsed.wantsAppointment) {
      pushBot("No entendi muy bien, queres una recomendacion de corte, consultar precios o agendar una cita?");
      return;
    }

    if (!parsed.service) {
      pushBot("Decime que servicio buscas, por ejemplo corte clasico, fade o corte con barba.");
      return;
    }

    const suggestedSlots = suggestAppointmentTimes({
      date: parsed.date,
      serviceId: parsed.service.id,
      barberId: parsed.barber?.id || undefined,
      limit: 3
    });

    const slot = suggestedSlots[0];
    if (!slot) {
      pushBot("No encuentro horarios disponibles dentro del horario de barberia. Probemos otra fecha o servicio.");
      return;
    }

    const suggested = {
      clientId: user?.id || null,
      clientName: user?.role === "guest" ? "Cliente Chat" : user?.name || "Cliente Chat",
      clientPhone: user?.phone || "",
      serviceId: parsed.service.id,
      barberId: slot.barberId,
      date: parsed.date,
      time: slot.time,
      source: "bot" as const,
      barberShopId: "spencer-barber-shop",
      checkedInAt: null,
      startedAt: null,
      completedAt: null,
      noShowAt: null,
      graceMinutes: 10,
      mediaReferences: []
    };

    const barberName = state.barbers.find((item) => item.id === slot.barberId)?.name || "el barbero disponible";
    pushBot(`Segun los turnos actuales, ${barberName} puede atenderte el ${parsed.date} a las ${slot.time}. Si te parece bien, confirma la cita sugerida.`);
    setDraft(suggested);
  }

  function confirmDraft() {
    if (!draft) return;

    try {
      const appointment = createAppointment({
        clientName: draft.clientName,
        clientPhone: draft.clientPhone,
        serviceId: draft.serviceId,
        barberId: draft.barberId,
        date: draft.date,
        time: draft.time,
        source: "bot",
        session: user || undefined
      });

      if (draftMedia.length) {
        attachMediaToAppointment(appointment.id, draftMedia);
      }

      pushBot("Listo. Tu cita fue creada y quedo registrada para el barbero.");
      setDraft(null);
      setDraftMedia([]);
    } catch (err) {
      pushBot(err instanceof Error ? err.message : "No pude crear esa cita. Probemos otro horario.");
    }
  }

  async function handleMedia(media: MediaReference[]) {
    setMessages((current) => [...current, { from: "user", text: "Adjunte una referencia.", media }]);
    const activeTicket = getActiveTicket();
    if (activeTicket) {
      attachMediaToTicket(activeTicket.id, media);
      pushBot("Perfecto, guarde la referencia en tu turno actual.");
    } else if (draft) {
      setDraftMedia((current) => [...current, ...media]);
      pushBot("Perfecto, usare esa referencia cuando confirmes la cita sugerida.");
    } else {
      pushBot("Recibi la referencia. Si quieres, ahora te ayudo a tomar turno o agendar una cita.");
    }
  }

  return (
    <div className="dashboard-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Chatbot de agenda</h2>
            <p>Asistente demo para precios, recomendaciones y citas sugeridas.</p>
          </div>
          <Bot />
        </div>

        <div className="chat-window">
          {messages.map((message, index) => (
            <div className={`chat-message ${message.from}`} key={`${message.from}-${index}`}>
              <p>{message.text}</p>
              <MediaReferenceList items={message.media || []} title="Adjunto" />
            </div>
          ))}
        </div>

        <MediaCapturePanel onAdd={handleMedia} labels={{ photo: "Tomar foto", video: "Grabar video", file: "Subir archivo" }} />

        <div className="chat-input">
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ej. quiero corte y barba manana con Spencer" />
          <button className="btn primary" onClick={sendMessage}><Send size={17} />Enviar</button>
        </div>
      </section>

      <aside className="panel">
        <div className="section-heading">
          <div>
            <h2>Cita sugerida</h2>
            <p>Confirma solo si te conviene el horario sugerido.</p>
          </div>
        </div>

        {draft ? (
          <div className="summary-card">
            <strong>{draft.clientName}</strong>
            <p>Servicio: {state.services.find((item) => item.id === draft.serviceId)?.name}</p>
            <p>Barbero: {state.barbers.find((item) => item.id === draft.barberId)?.name}</p>
            <p>Fecha: {draft.date}</p>
            <p>Hora: {draft.time}</p>
            <MediaReferenceList items={draftMedia} title="Referencia para la cita" />
            <button className="btn success full" onClick={confirmDraft}>Confirmar cita sugerida</button>
          </div>
        ) : (
          <div className="alert info">Aun no hay cita sugerida. Escribe algo con intencion clara, por ejemplo pedir precio, recomendacion o una cita.</div>
        )}
      </aside>
    </div>
  );
}

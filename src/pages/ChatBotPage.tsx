import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  CalendarCheck,
  Clock3,
  DollarSign,
  MessageCircle,
  Scissors,
  Send,
  Sparkles,
  Ticket,
} from "lucide-react";

import { MediaCapturePanel } from "../components/MediaCapturePanel";
import { MediaReferenceList } from "../components/MediaReferenceList";
import { useAuth } from "../context/AuthContext";
import { createAppointment, suggestAppointmentTimes } from "../services/appointmentService";
import { attachMediaToAppointment, attachMediaToTicket } from "../services/mediaService";
import { useAppData } from "../services/localStore";
import { getActiveTicket } from "../services/queueService";
import type { MediaReference } from "../types";
import { nextAppointmentDateInputValue } from "../utils/time";

type ChatMessage = {
  from: "bot" | "user";
  text: string;
  media?: MediaReference[];
};

type AppointmentDraft = {
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  source: "bot";
  barberShopId: string;
  mediaReferences: MediaReference[];
};

type ParsedIntent = {
  wantsAppointment: boolean;
  asksPrice: boolean;
  asksRecommendation: boolean;
  asksAvailability: boolean;
  asksServices: boolean;
  asksTurn: boolean;
  serviceId: string | null;
  barberId: string | null;
  date: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function dateInputFromOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export default function ChatBotPage() {
  const state = useAppData();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "bot",
      text:
        "Hola 👋 Soy el asistente de Spencer Barber Shop. Puedo ayudarte con precios, recomendaciones de corte, turnos y citas. También podés enviarme una foto o video de referencia.",
    },
  ]);

  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<AppointmentDraft | null>(null);
  const [draftMedia, setDraftMedia] = useState<MediaReference[]>([]);

  const activeServices = useMemo(
    () => state.services.filter((service) => service.active),
    [state.services]
  );

  const activeBarbers = useMemo(
    () => state.barbers.filter((barber) => barber.active),
    [state.barbers]
  );

  const hasMediaReference = messages.some((message) => (message.media || []).length > 0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, draft]);

  function pushBot(text: string, media?: MediaReference[]) {
    setMessages((current) => {
      const last = current[current.length - 1];

      if (last?.from === "bot" && last.text === text) {
        return current;
      }

      return [...current, { from: "bot", text, media }];
    });
  }

  function detectServiceId(text: string) {
    const lower = normalizeText(text);

    if (/(corte y barba|barba|perfilado|barbon|beard)/.test(lower)) {
      return (
        activeServices.find((service) => normalizeText(service.name).includes("barba"))?.id ||
        null
      );
    }

    if (/(fade|degradado|low fade|mid fade|burst fade|taper)/.test(lower)) {
      return (
        activeServices.find((service) => {
          const name = normalizeText(service.name);
          return name.includes("fade") || name.includes("degradado");
        })?.id || null
      );
    }

    if (/(ceja|cejas|diseno|diseño|linea|lineas)/.test(lower)) {
      return (
        activeServices.find((service) => {
          const name = normalizeText(service.name);
          return name.includes("ceja") || name.includes("diseno");
        })?.id || null
      );
    }

    if (/(clasico|clasico|corte|recorte|cabello|pelo)/.test(lower)) {
      return (
        activeServices.find((service) => {
          const name = normalizeText(service.name);
          return name.includes("clasico") || name.includes("corte");
        })?.id || null
      );
    }

    return null;
  }

  function detectBarberId(text: string) {
    const lower = normalizeText(text);

    return (
      activeBarbers.find((barber) => lower.includes(normalizeText(barber.name)))?.id || null
    );
  }

  function detectDate(text: string) {
    const lower = normalizeText(text);

    if (/\b(hoy)\b/.test(lower)) {
      return dateInputFromOffset(0);
    }

    if (/\b(manana|mañana)\b/.test(lower)) {
      return dateInputFromOffset(1);
    }

    if (/(pasado manana|pasado mañana)/.test(lower)) {
      return dateInputFromOffset(2);
    }

    return nextAppointmentDateInputValue();
  }

  function parseIntent(text: string): ParsedIntent {
    const lower = normalizeText(text);

    return {
      wantsAppointment: /(cita|agendar|reservar|agenda|programar|separar|manana|mañana|hoy|pasado)/.test(
        lower
      ),
      asksPrice: /(precio|cuanto|cuánto|vale|cuesta|costo|tarifa|lps|lempiras|valor)/.test(
        lower
      ),
      asksRecommendation:
        /(recomienda|recomendacion|recomendación|que corte|qué corte|look|estilo|me queda|rostro|cara|foto|referencia|moderno|elegante|limpio|formal|juvenil|de moda|tendencia|nuevo look|cambio de look)/.test(
          lower
        ),
      asksAvailability: /(disponible|disponibilidad|horario|hora|cuando|cuándo|libre)/.test(
        lower
      ),
      asksServices: /(servicio|servicios|que hacen|qué hacen|ofrecen|menu|menú|catalogo|catálogo)/.test(
        lower
      ),
      asksTurn: /(turno|llegue|llegar|qr|espera|fila|lista|cola)/.test(lower),
      serviceId: detectServiceId(text),
      barberId: detectBarberId(text),
      date: detectDate(text),
    };
  }

  function servicesText() {
    if (!activeServices.length) {
      return "Todavía no hay servicios configurados.";
    }

    return activeServices
      .map((service) => `• ${service.name}: L${service.price}, aprox. ${service.duration} min`)
      .join("\n");
  }

  function getFallbackBarberName(barberId?: string | null) {
    return (
      activeBarbers.find((barber) => barber.id === barberId)?.name ||
      activeBarbers.find((barber) => normalizeText(barber.name).includes("spencer"))?.name ||
      activeBarbers[0]?.name ||
      "Spencer"
    );
  }

  function recommendationText(serviceId: string | null) {
    const service = activeServices.find((item) => item.id === serviceId);
    const serviceName = normalizeText(service?.name || "");

    if (serviceName.includes("barba")) {
      return (
        "Para corte + barba te recomiendo un acabado limpio con laterales degradados y barba perfilada. " +
        "Se ve elegante, ordenado y funciona bien para trabajo, eventos o salidas. Si querés algo más moderno, combiná barba marcada con low fade."
      );
    }

    if (serviceName.includes("fade") || serviceName.includes("degradado")) {
      return (
        "Buenísima elección. Para fade te recomiendo:\n" +
        "• Low Fade si querés algo limpio y discreto.\n" +
        "• Mid Fade si querés algo moderno pero no tan marcado.\n" +
        "• Burst Fade si querés algo más llamativo.\n\n" +
        "Spencer puede ajustarlo según tu tipo de cabello y la referencia que mandés."
      );
    }

    if (serviceName.includes("ceja") || serviceName.includes("diseno")) {
      return "Para cejas/diseño te recomiendo algo natural, limpio y no demasiado marcado, para que se vea bien sin exagerar.";
    }

    if (hasMediaReference) {
      return (
        "Ya recibí tu referencia. Sin IA visual real conectada todavía, la usaré como guía para el barbero. " +
        "Por lo que normalmente buscan los clientes, te recomendaría un estilo limpio con laterales ordenados y la parte superior controlada. " +
        "Si querés algo moderno, un low fade o mid fade sería una buena opción."
      );
    }

    return (
      "Para recomendarte mejor, podés mandarme una foto o video de referencia. " +
      "Como opción segura, un corte clásico o un low fade se miran limpios, modernos y fáciles de mantener."
    );
  }

  function explainService(serviceId: string, barberName = "Spencer") {
    const service = activeServices.find((item) => item.id === serviceId);

    if (!service) {
      pushBot(`Estos son los servicios disponibles:\n\n${servicesText()}`);
      return;
    }

    pushBot(
      `Buenísimo. ${service.name} cuesta L${service.price} y dura aproximadamente ${service.duration} minutos.\n\n` +
        `Podés tomar turno si ya estás en la barbería, o puedo ayudarte a agendar una cita con ${barberName}.`
    );
  }

  function suggestAppointment(parsed: ParsedIntent) {
    const service = activeServices.find((item) => item.id === parsed.serviceId) || null;

    if (!service) {
      pushBot(
        "Perfecto, te ayudo a agendar. Primero decime qué servicio querés: corte clásico, fade/degradado, corte + barba o cejas/diseño."
      );
      return;
    }

    const suggestedSlots = suggestAppointmentTimes({
      date: parsed.date,
      serviceId: service.id,
      barberId: parsed.barberId || undefined,
      limit: 3,
    });

    const slot = suggestedSlots[0];

    if (!slot) {
      pushBot(
        "No encontré horarios disponibles dentro del horario de la barbería. Probemos otra fecha, otro servicio o cualquier barbero disponible."
      );
      return;
    }

    const barberName = getFallbackBarberName(slot.barberId);

    const suggested: AppointmentDraft = {
      clientId: user?.id || null,
      clientName: user?.role === "guest" ? "Cliente Chat" : user?.name || "Cliente Chat",
      clientPhone: user?.phone || "",
      serviceId: service.id,
      barberId: slot.barberId,
      date: parsed.date,
      time: slot.time,
      source: "bot",
      barberShopId: "spencer-barber-shop",
      mediaReferences: [],
    };

    setDraft(suggested);

    pushBot(
      `Listo. Según los turnos y citas actuales, ${barberName} puede atenderte el ${parsed.date} a las ${slot.time} para ${service.name}.\n\n` +
        "Confirmá la cita sugerida solo si te conviene ese horario."
    );
  }

  function handleBotResponse(userText: string) {
    const parsed = parseIntent(userText);
    const cleanText = normalizeText(userText);
    const service = activeServices.find((item) => item.id === parsed.serviceId) || null;
    const barberName = getFallbackBarberName(parsed.barberId);

    const greetingOnly = /^(hola|hey|buenas|que ondas|que tal|buenos dias|buenas tardes|buenas noches)$/i.test(
      cleanText
    );

    if (greetingOnly) {
      pushBot(
        "¡Qué ondas! 👋 Soy el asistente de Spencer Barber Shop. Te puedo ayudar con precios, servicios, recomendaciones de corte, turnos y citas. También podés mandarme una foto o video de referencia."
      );
      return;
    }

    if (parsed.asksServices) {
      pushBot(`Estos son los servicios disponibles:\n\n${servicesText()}`);
      return;
    }

    if (parsed.asksPrice) {
      if (service) {
        pushBot(
          `${service.name} cuesta L${service.price} y dura aproximadamente ${service.duration} minutos. ¿Querés tomar turno o agendar una cita con ${barberName}?`
        );
      } else {
        pushBot(`Claro, estos son los precios disponibles:\n\n${servicesText()}`);
      }
      return;
    }

    if (parsed.wantsAppointment) {
      suggestAppointment(parsed);
      return;
    }

    if (service && !parsed.asksRecommendation) {
      explainService(service.id, barberName);
      return;
    }

    if (parsed.asksTurn) {
      pushBot(
        "Para tomar turno, escaneá el QR de entrada o entrá a la sección Turnos. El sistema te genera un ticket automático y te muestra tu tiempo estimado de espera."
      );
      return;
    }

    if (parsed.asksRecommendation) {
      pushBot(recommendationText(parsed.serviceId));
      return;
    }

    pushBot(
      "Te entiendo. Para ayudarte mejor, podés decirme algo como:\n\n" +
        "• ¿Cuánto cuesta corte y barba?\n" +
        "• Recomendame un fade moderno\n" +
        "• Quiero cita mañana con Spencer\n" +
        "• Quiero tomar turno\n\n" +
        "También podés mandarme una foto o video de referencia."
    );
  }

  function sendMessage(customText?: string) {
    const userText = (customText || input).trim();

    if (!userText) return;

    setMessages((current) => [...current, { from: "user", text: userText }]);
    setInput("");

    window.setTimeout(() => {
      try {
        handleBotResponse(userText);
      } catch (error) {
        console.error("Chatbot response error:", error);

        setMessages((current) => [
          ...current,
          {
            from: "bot",
            text:
              "Disculpame, tuve un problema procesando el mensaje. Probá preguntándome por precios, servicios, recomendaciones o citas.",
          },
        ]);
      }
    }, 120);
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
        session: user || undefined,
      });

      if (draftMedia.length) {
        attachMediaToAppointment(appointment.id, draftMedia);
      }

      pushBot("Listo ✅ Tu cita quedó registrada. Spencer podrá ver tu referencia si adjuntaste foto o video.");
      setDraft(null);
      setDraftMedia([]);
    } catch (error) {
      pushBot(error instanceof Error ? error.message : "No pude crear esa cita. Probemos otro horario.");
    }
  }

  async function handleMedia(media: MediaReference[]) {
    setMessages((current) => [...current, { from: "user", text: "Adjunté una referencia.", media }]);

    const activeTicket = getActiveTicket();

    if (activeTicket) {
      attachMediaToTicket(activeTicket.id, media);
      pushBot(
        "Perfecto, guardé la referencia en tu turno actual. Spencer podrá verla antes de atenderte. Si querés, también puedo recomendarte un estilo parecido."
      );
      return;
    }

    setDraftMedia((current) => [...current, ...media]);

    if (draft) {
      pushBot("Perfecto, voy a usar esa referencia cuando confirmés la cita sugerida.");
      return;
    }

    pushBot(
      "Recibí tu referencia. Aún no tengo análisis visual real conectado, pero puedo ayudarte como asistente de barbería: si querés algo moderno, te recomendaría low fade, mid fade o corte + barba según el estilo que buscás. También puedo ayudarte a agendar con Spencer."
    );
  }

  const quickPrompts = [
    "¿Cuánto cuesta corte y barba?",
    "Recomendame un fade moderno",
    "Quiero cita mañana con Spencer",
    "¿Qué servicios tienen?",
  ];

  return (
    <div className="dashboard-grid chatbot-pro-layout">
      <section className="panel chatbot-pro-panel">
        <div className="section-heading chatbot-heading">
          <div>
            <span className="section-kicker">Asistente de barbería</span>
            <h3>Chatbot de Spencer</h3>
            <p>Consultá precios, recomendaciones, referencias y citas sugeridas.</p>
          </div>

          <div className="chatbot-bot-icon">
            <Bot size={22} />
          </div>
        </div>

        <div className="chatbot-suggestion-row">
          {quickPrompts.map((prompt) => (
            <button
              type="button"
              className="chatbot-chip"
              key={prompt}
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="chatbot-window">
          {messages.map((message, index) => (
            <article
              className={`chat-message-pro ${message.from === "user" ? "from-user" : "from-bot"}`}
              key={`${message.from}-${index}`}
            >
              <div className="chat-avatar">
                {message.from === "user" ? <MessageCircle size={17} /> : <Bot size={17} />}
              </div>

              <div className="chat-bubble-pro">
                <p>{message.text}</p>
                <MediaReferenceList items={message.media || []} title="Adjunto" />
              </div>
            </article>
          ))}
          <div ref={bottomRef} />
        </div>

        <MediaCapturePanel
          onAdd={handleMedia}
          labels={{
            photo: "Tomar foto",
            video: "Grabar video",
            file: "Subir referencia",
          }}
        />

        <form
          className="chat-input-pro"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ej. quiero corte y barba mañana con Spencer"
            autoComplete="off"
          />

          <button type="submit" className="btn primary">
            <Send size={18} />
            Enviar
          </button>
        </form>
      </section>

      <aside className="panel appointment-suggestion-pro">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Agenda inteligente</span>
            <h3>Cita sugerida</h3>
            <p>Confirmá solo si te conviene el horario sugerido.</p>
          </div>
        </div>

        {draft ? (
          <div className="suggestion-card-pro">
            <div className="suggestion-main-icon">
              <CalendarCheck size={24} />
            </div>

            <div>
              <h4>{draft.clientName}</h4>

              <div className="suggestion-meta-list">
                <span>
                  <Scissors size={16} />
                  {activeServices.find((service) => service.id === draft.serviceId)?.name || "Servicio"}
                </span>

                <span>
                  <Sparkles size={16} />
                  {activeBarbers.find((barber) => barber.id === draft.barberId)?.name || "Spencer"}
                </span>

                <span>
                  <Clock3 size={16} />
                  {draft.date} · {draft.time}
                </span>

                <span>
                  <Ticket size={16} />
                  Origen: Chat Bot
                </span>
              </div>

              <MediaReferenceList items={draftMedia} title="Referencia para la cita" />

              <button type="button" className="btn success suggestion-confirm" onClick={confirmDraft}>
                <CalendarCheck size={18} />
                Confirmar cita sugerida
              </button>
            </div>
          </div>
        ) : (
          <div className="chatbot-empty-guide">
            <DollarSign size={28} />
            <h4>Aún no hay cita sugerida</h4>
            <p>
              Escribí algo claro como: “quiero cita mañana con Spencer” o “quiero corte y barba”.
            </p>

            <div className="mini-service-list">
              {activeServices.map((service) => (
                <span key={service.id}>
                  {service.name} · L{service.price}
                </span>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

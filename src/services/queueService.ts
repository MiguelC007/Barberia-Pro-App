import type { QueueItem, QueueSource, QueueStatus, SessionUser } from "../types";
import { getAppState, mutateAppState } from "./localStore";
import { getNextQueueItemForBarber, sortQueueFIFO } from "../utils/fifo";
import { createId } from "../utils/id";
import {
  calculateQueueTimeline,
  generateTicketCode,
  getBusinessPrefix,
  getServiceDurationMinutes,
  isActiveTicketStatus,
  isClosedTicketStatus,
  nextDailySequence,
  normalizeTicketStatus
} from "../utils/queueTimeline";

const ACTIVE_TICKET_KEY = "spencer_barber_shop_active_ticket_v1";
const DEFAULT_BARBERSHOP_ID = "spencer-barber-shop";

function readActiveTicketId(): string | null {
  return localStorage.getItem(ACTIVE_TICKET_KEY);
}

function saveActiveTicketId(ticketId: string): void {
  localStorage.setItem(ACTIVE_TICKET_KEY, ticketId);
}

function clearActiveTicketId(ticketId?: string): void {
  if (!ticketId || readActiveTicketId() === ticketId) {
    localStorage.removeItem(ACTIVE_TICKET_KEY);
  }
}

function createTicketCode(queue: QueueItem[], prefix: string, sequence: number, now: number): string {
  let code = generateTicketCode(prefix, sequence, now);
  while (queue.some((item) => item.ticketCode === code)) {
    code = generateTicketCode(prefix, sequence, now);
  }
  return code;
}

function activeServiceId(serviceId?: string): string {
  const state = getAppState();
  const service = serviceId
    ? state.services.find((item) => item.id === serviceId && item.active)
    : state.services.find((item) => item.active);
  if (!service) {
    throw new Error("Selecciona un servicio activo.");
  }
  return service.id;
}

function validatePreferredBarber(preferredBarberId?: string): string | null {
  if (!preferredBarberId) return null;
  const state = getAppState();
  const preferredBarber = state.barbers.find((item) => item.id === preferredBarberId && item.active);
  if (!preferredBarber) {
    throw new Error("El barbero seleccionado no esta disponible en la app.");
  }
  return preferredBarber.id;
}

function findDuplicateTicket(input: {
  clientName: string;
  clientPhone?: string;
  session?: SessionUser | null;
  allowDeviceTicketReuse?: boolean;
}): QueueItem | null {
  const state = getAppState();
  const localTicketId = readActiveTicketId();
  const clientName = input.clientName.trim().toLowerCase();
  const clientPhone = input.clientPhone?.trim();

  return (
    state.queue.find(
      (item) =>
        input.allowDeviceTicketReuse &&
        localTicketId &&
        item.id === localTicketId &&
        isActiveTicketStatus(item.status)
    ) ||
    state.queue.find(
      (item) =>
        isActiveTicketStatus(item.status) &&
        ((input.session?.id && item.clientId === input.session.id) ||
          (clientPhone && (item.clientPhone === clientPhone || item.whatsapp === clientPhone)) ||
          (clientName && item.clientName.trim().toLowerCase() === clientName))
    ) ||
    null
  );
}

export function getActiveTicket(): QueueItem | null {
  const state = getAppState();
  const localTicketId = readActiveTicketId();
  if (!localTicketId) return null;

  const ticket = state.queue.find((item) => item.id === localTicketId && isActiveTicketStatus(item.status));
  if (!ticket) {
    clearActiveTicketId(localTicketId);
    return null;
  }

  return ticket;
}

export function createQueueTicket(input: {
  clientName?: string;
  clientPhone?: string;
  serviceId?: string;
  preferredBarberId?: string;
  note?: string;
  source: QueueSource;
  session?: SessionUser | null;
  reuseDeviceTicket?: boolean;
}): QueueItem {
  const current = getAppState();
  const serviceId = activeServiceId(input.serviceId);
  const service = current.services.find((item) => item.id === serviceId);
  const preferredBarberId = validatePreferredBarber(input.preferredBarberId);
  const clientName = input.clientName?.trim() || input.session?.name || "Cliente";
  const clientPhone = input.clientPhone?.trim() || input.session?.phone || "";

  if (input.reuseDeviceTicket) {
    const active = getActiveTicket();
    if (active) return active;
  }

  const duplicate = findDuplicateTicket({
    clientName,
    clientPhone,
    session: input.session,
    allowDeviceTicketReuse: Boolean(input.reuseDeviceTicket)
  });
  if (duplicate) {
    if (input.reuseDeviceTicket) saveActiveTicketId(duplicate.id);
    return duplicate;
  }

  const now = Date.now();
  const dailySequenceNumber = nextDailySequence(current.queue, now);
  const ticketCode = createTicketCode(current.queue, getBusinessPrefix(current), dailySequenceNumber, now);

  const item: QueueItem = {
    id: createId("ticket"),
    barberShopId: DEFAULT_BARBERSHOP_ID,
    ticketCode,
    dailySequenceNumber,
    clientId: input.session?.id || null,
    clientName,
    clientPhone,
    whatsapp: clientPhone,
    source: input.source,
    serviceId: serviceId,
    serviceName: service?.name || "Servicio",
    estimatedDurationMinutes: getServiceDurationMinutes(service),
    preferredBarberId,
    assignedBarberId: null,
    status: "waiting",
    note: input.note?.trim() || "",
    notes: input.note?.trim() || "",
    position: dailySequenceNumber,
    createdAt: now,
    waitStartedAt: now,
    joinedAt: now,
    estimatedStartAt: null,
    estimatedEndAt: null,
    calledAt: null,
    startedAt: null,
    serviceStartedAt: null,
    serviceEndedAt: null,
    finishedAt: null,
    completedAt: null,
    skippedAt: null,
    cancelledAt: null,
    mediaReferences: []
  };

  mutateAppState((state) => ({
    ...state,
    queue: sortQueueFIFO([...state.queue, item])
  }));

  if (input.reuseDeviceTicket || input.source === "qr") {
    saveActiveTicketId(item.id);
  }

  return item;
}

export function createQueueItem(input: {
  clientName: string;
  clientPhone?: string;
  serviceId: string;
  preferredBarberId?: string;
  note?: string;
  session?: SessionUser | null;
}): QueueItem {
  return createQueueTicket({
    ...input,
    source: "client",
    reuseDeviceTicket: false
  });
}

export function createManualTicket(input: {
  clientName: string;
  serviceId?: string;
  preferredBarberId?: string;
  note?: string;
  session?: SessionUser | null;
}): QueueItem {
  if (!input.clientName.trim()) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  return createQueueTicket({
    clientName: input.clientName,
    serviceId: input.serviceId,
    preferredBarberId: input.preferredBarberId,
    note: input.note,
    source: "manual",
    session: null,
    reuseDeviceTicket: false
  });
}

export function updateTicketDetails(ticketId: string, updates: Partial<Pick<QueueItem, "clientName" | "clientPhone" | "serviceId" | "preferredBarberId" | "note" | "notes">>): void {
  mutateAppState((state) => ({
    ...state,
    queue: state.queue.map((item) => {
      if (item.id !== ticketId) return item;
      const service = updates.serviceId ? state.services.find((entry) => entry.id === updates.serviceId) : null;
      return {
        ...item,
        ...updates,
        whatsapp: updates.clientPhone ?? item.whatsapp,
        serviceName: service?.name || item.serviceName,
        estimatedDurationMinutes: service ? getServiceDurationMinutes(service) : item.estimatedDurationMinutes
      };
    })
  }));
}

export function updateTicketStatus(ticketId: string, status: QueueStatus): void {
  const normalized = normalizeTicketStatus(status);
  const now = Date.now();

  mutateAppState((state) => ({
    ...state,
    queue: state.queue.map((item) => {
      if (item.id !== ticketId) return item;
      return {
        ...item,
        status: normalized,
        skippedAt: normalized === "skipped" ? now : item.skippedAt,
        cancelledAt: normalized === "cancelled" ? now : item.cancelledAt,
        completedAt: normalized === "completed" ? now : item.completedAt
      };
    })
  }));

  if (isClosedTicketStatus(normalized)) {
    clearActiveTicketId(ticketId);
  }
}

export function callNextForBarber(barberId: string): void {
  mutateAppState((state) => {
    const barber = state.barbers.find((item) => item.id === barberId && item.active);
    if (!barber || barber.status !== "available") {
      throw new Error("El barbero no esta disponible.");
    }

    const next = getNextQueueItemForBarber(sortQueueFIFO(state.queue), barber);
    if (!next) {
      throw new Error("No hay clientes disponibles en los turnos para este barbero.");
    }

    const now = Date.now();

    return {
      ...state,
      queue: state.queue.map((item) =>
        item.id === next.id
          ? {
              ...item,
              status: "in_service",
              assignedBarberId: barber.id,
              calledAt: now,
              startedAt: now,
              serviceStartedAt: now
            }
          : item
      ),
      barbers: state.barbers.map((item) =>
        item.id === barber.id
          ? {
              ...item,
              status: "busy",
              currentQueueId: next.id,
              currentClientName: next.clientName,
              serviceStartedAt: now
            }
          : item
      )
    };
  });
}

export function finishServiceForBarber(barberId: string): void {
  let closedTicketId: string | null = null;

  mutateAppState((state) => {
    const barber = state.barbers.find((item) => item.id === barberId && item.active);
    if (!barber || barber.status !== "busy" || !barber.currentQueueId) {
      throw new Error("Este barbero no tiene servicio activo.");
    }

    const now = Date.now();
    closedTicketId = barber.currentQueueId;

    return {
      ...state,
      queue: state.queue.map((item) =>
        item.id === barber.currentQueueId
          ? {
              ...item,
              status: "completed",
              finishedAt: now,
              serviceEndedAt: now,
              completedAt: now
            }
          : item
      ),
      barbers: state.barbers.map((item) =>
        item.id === barber.id
          ? {
              ...item,
              status: "available",
              currentQueueId: null,
              currentClientName: null,
              serviceStartedAt: null,
              doneToday: item.doneToday + 1
            }
          : item
      )
    };
  });

  if (closedTicketId) {
    clearActiveTicketId(closedTicketId);
  }
}

export function skipTicket(ticketId: string): void {
  updateTicketStatus(ticketId, "skipped");
}

export function cancelTicket(ticketId: string): void {
  updateTicketStatus(ticketId, "cancelled");
}

export function removeDoneQueueItems(): void {
  mutateAppState((state) => ({
    ...state,
    queue: state.queue.filter((item) => !isClosedTicketStatus(normalizeTicketStatus(item.status)))
  }));
}

export function getActiveQueue() {
  return sortQueueFIFO(getAppState().queue.filter((item) => isActiveTicketStatus(item.status)));
}

export function getTicketTimeline(ticketId: string) {
  return calculateQueueTimeline(getAppState()).find((entry) => entry.item.id === ticketId) || null;
}

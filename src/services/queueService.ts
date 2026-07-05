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
const DEVICE_KEY = "spencer_barber_shop_device_v1";
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

function getDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const deviceId = createId("device");
  localStorage.setItem(DEVICE_KEY, deviceId);
  return deviceId;
}

function createTicketCode(queue: QueueItem[], prefix: string, initialSequence: number, now: number): { ticketCode: string; sequence: number } {
  let sequence = initialSequence;
  let ticketCode = generateTicketCode(prefix, sequence, now);

  while (queue.some((item) => item.ticketCode === ticketCode)) {
    sequence += 1;
    ticketCode = generateTicketCode(prefix, sequence, now);
  }

  return { ticketCode, sequence };
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
    throw new Error("El barbero seleccionado no está disponible en el sistema.");
  }
  return preferredBarber.id;
}

function getOpenTicketForBarber(barberId: string): QueueItem | null {
  const state = getAppState();
  return (
    state.queue.find(
      (item) =>
        item.assignedBarberId === barberId &&
        ["next", "called", "in_service"].includes(normalizeTicketStatus(item.status))
    ) || null
  );
}

function findDuplicateTicket(input: {
  clientName: string;
  clientPhone?: string;
  session?: SessionUser | null;
  deviceId?: string;
  allowDeviceTicketReuse?: boolean;
}): QueueItem | null {
  const state = getAppState();
  const localTicketId = readActiveTicketId();
  const normalizedName = input.clientName.trim().toLowerCase();
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
        ((input.deviceId && item.deviceId === input.deviceId) ||
          (input.session?.id && item.clientId === input.session.id) ||
          (clientPhone && (item.clientPhone === clientPhone || item.whatsapp === clientPhone)) ||
          (normalizedName && item.clientName.trim().toLowerCase() === normalizedName))
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
  const clientName = input.clientName?.trim() || input.session?.name || "";
  const clientPhone = input.clientPhone?.trim() || input.session?.phone || "";
  const deviceId = getDeviceId();

  if (input.reuseDeviceTicket) {
    const active = getActiveTicket();
    if (active) return active;
  }

  const duplicate = findDuplicateTicket({
    clientName,
    clientPhone,
    session: input.session,
    deviceId,
    allowDeviceTicketReuse: Boolean(input.reuseDeviceTicket)
  });
  if (duplicate) {
    if (input.reuseDeviceTicket || input.source === "qr") {
      saveActiveTicketId(duplicate.id);
    }
    return duplicate;
  }

  const now = Date.now();
  const { ticketCode, sequence } = createTicketCode(current.queue, getBusinessPrefix(current), nextDailySequence(current.queue, now), now);

  const item: QueueItem = {
    id: createId("ticket"),
    barberShopId: DEFAULT_BARBERSHOP_ID,
    ticketCode,
    dailySequenceNumber: sequence,
    clientId: input.session?.id || null,
    clientName,
    clientPhone,
    whatsapp: clientPhone,
    deviceId,
    source: input.source,
    serviceId,
    serviceName: service?.name || "Servicio",
    estimatedDurationMinutes: getServiceDurationMinutes(service),
    preferredBarberId,
    assignedBarberId: null,
    status: "waiting",
    note: input.note?.trim() || "",
    notes: input.note?.trim() || "",
    position: sequence,
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

export function updateTicketDetails(
  ticketId: string,
  updates: Partial<Pick<QueueItem, "clientName" | "clientPhone" | "serviceId" | "preferredBarberId" | "note" | "notes">>
): void {
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

export function takeNextForBarber(barberId: string): QueueItem {
  const current = getAppState();
  const barber = current.barbers.find((item) => item.id === barberId && item.active);
  if (!barber) {
    throw new Error("El barbero no existe o está inactivo.");
  }
  if (barber.status === "busy") {
    throw new Error("El barbero ya está atendiendo un servicio.");
  }

  const open = getOpenTicketForBarber(barberId);
  if (open && ["next", "called"].includes(normalizeTicketStatus(open.status))) {
    return open;
  }
  if (open?.status === "in_service") {
    throw new Error("El barbero ya tiene un cliente en atención.");
  }

  const next = getNextQueueItemForBarber(sortQueueFIFO(current.queue), barber);
  if (!next) {
    throw new Error("No hay clientes disponibles para este barbero.");
  }

  mutateAppState((state) => ({
    ...state,
    queue: state.queue.map((item) =>
      item.id === next.id
        ? {
            ...item,
            status: "next",
            assignedBarberId: barber.id
          }
        : item
    )
  }));

  return {
    ...next,
    status: "next",
    assignedBarberId: barber.id
  };
}

export function callReservedTicket(barberId: string): QueueItem {
  const openTicket = getOpenTicketForBarber(barberId);
  if (!openTicket) {
    throw new Error("Primero toma el siguiente ticket.");
  }
  if (openTicket.status === "in_service") {
    return openTicket;
  }

  const now = Date.now();
  mutateAppState((state) => ({
    ...state,
    queue: state.queue.map((item) =>
      item.id === openTicket.id
        ? {
            ...item,
            status: "called",
            calledAt: now
          }
        : item
    )
  }));

  return {
    ...openTicket,
    status: "called",
    calledAt: now
  };
}

export function startServiceForBarber(barberId: string): QueueItem {
  const barberState = getAppState();
  const barber = barberState.barbers.find((item) => item.id === barberId && item.active);
  if (!barber) {
    throw new Error("El barbero no existe o está inactivo.");
  }

  const reservedTicket = getOpenTicketForBarber(barberId) || takeNextForBarber(barberId);
  const now = Date.now();

  mutateAppState((state) => ({
    ...state,
    queue: state.queue.map((item) =>
      item.id === reservedTicket.id
        ? {
            ...item,
            status: "in_service",
            assignedBarberId: barber.id,
            calledAt: item.calledAt || now,
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
            currentQueueId: reservedTicket.id,
            currentClientName: reservedTicket.clientName,
            serviceStartedAt: now
          }
        : item
    )
  }));

  return {
    ...reservedTicket,
    status: "in_service",
    assignedBarberId: barber.id,
    calledAt: reservedTicket.calledAt || now,
    startedAt: now,
    serviceStartedAt: now
  };
}

export function callNextForBarber(barberId: string): void {
  startServiceForBarber(barberId);
}

export function finishServiceForBarber(barberId: string): void {
  let closedTicketId: string | null = null;

  mutateAppState((state) => {
    const barber = state.barbers.find((item) => item.id === barberId && item.active);
    if (!barber || barber.status !== "busy" || !barber.currentQueueId) {
      throw new Error("Este barbero no tiene un servicio activo.");
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

export function releaseBarberTicket(barberId: string): void {
  mutateAppState((state) => ({
    ...state,
    queue: state.queue.map((item) =>
      item.assignedBarberId === barberId && ["next", "called"].includes(normalizeTicketStatus(item.status))
        ? {
            ...item,
            status: "waiting",
            assignedBarberId: null,
            calledAt: null
          }
        : item
    )
  }));
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

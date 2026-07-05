import type { Appointment, AppState, Barber, QueueItem, QueueStatus, Service } from "../types";

export const SERVICE_BUFFER_MINUTES = 5;
export const DEFAULT_SERVICE_MINUTES = 25;
export const DEFAULT_BUSINESS_START = "09:00";
export const DEFAULT_BUSINESS_END = "20:00";

export interface QueueTimelineEntry {
  item: QueueItem;
  position: number;
  estimatedStartAt: number;
  estimatedEndAt: number;
  estimatedWaitMinutes: number;
  waitedMinutes: number;
  assignedBarberSuggestion: string | null;
  assignedBarberId: string | null;
}

export interface AvailableSlot {
  barberId: string;
  barberName: string;
  time: string;
  startsAt: number;
  endsAt: number;
  waitMinutes: number;
  peopleBefore: number;
}

export interface NextTurnEstimate {
  waitMinutes: number;
  startsAt: number;
}

const ACTIVE_TICKET_STATUSES: QueueStatus[] = ["waiting", "next", "called", "in_service"];
const CLOSED_TICKET_STATUSES: QueueStatus[] = ["completed", "done", "skipped", "cancelled"];

export function isActiveTicketStatus(status: QueueStatus): boolean {
  return ACTIVE_TICKET_STATUSES.includes(status);
}

export function isClosedTicketStatus(status: QueueStatus): boolean {
  return CLOSED_TICKET_STATUSES.includes(status);
}

export function queueCreatedAt(item: QueueItem): number {
  return item.waitStartedAt || item.joinedAt || item.createdAt || Date.now();
}

export function getServiceDurationMinutes(service?: Service | null, fallback?: number): number {
  if (service?.duration && Number.isFinite(service.duration)) return service.duration;
  if (fallback && Number.isFinite(fallback)) return fallback;
  return DEFAULT_SERVICE_MINUTES;
}

export function getQueueService(state: AppState, item: QueueItem): Service | null {
  return state.services.find((service) => service.id === item.serviceId) || null;
}

export function ticketStatusLabel(status: QueueStatus): string {
  const labels: Record<QueueStatus, string> = {
    waiting: "En espera",
    next: "Siguiente",
    called: "Siguiente",
    in_service: "En atención",
    completed: "Finalizado",
    done: "Finalizado",
    skipped: "Saltado",
    cancelled: "Cancelado"
  };
  return labels[status] || status;
}

export function ticketSourceLabel(source?: string): string {
  if (source === "qr") return "QR";
  if (source === "manual") return "Manual";
  if (source === "admin") return "Admin";
  if (source === "client") return "Cliente";
  return "Sistema";
}

export function normalizeTicketStatus(status: QueueStatus): QueueStatus {
  if (status === "done") return "completed";
  if (status === "called") return "next";
  return status;
}

export function sortTicketsChronologically(queue: QueueItem[]): QueueItem[] {
  return [...queue].sort((a, b) => queueCreatedAt(a) - queueCreatedAt(b));
}

export function calculateWaitedMinutes(item: QueueItem, now = Date.now()): number {
  return Math.max(0, Math.floor((now - queueCreatedAt(item)) / 60000));
}

function dateKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

export function getBusinessPrefix(state: AppState): string {
  const initials = state.business.logoText || state.business.appName;
  const clean = initials.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 3);
  return clean || "SB";
}

export function nextDailySequence(queue: QueueItem[], now = Date.now()): number {
  const today = dateKey(now);
  const todaysTickets = queue.filter((item) => {
    const created = queueCreatedAt(item);
    return dateKey(created) === today;
  });
  const maxSequence = todaysTickets.reduce((max, item) => Math.max(max, item.dailySequenceNumber || 0), 0);
  return maxSequence + 1;
}

export function generateTicketCode(prefix: string, sequence: number, now = Date.now()): string {
  return `${prefix}-${dateKey(now)}-${String(sequence).padStart(3, "0")}`;
}

function appointmentStartMs(appointment: Appointment): number {
  return new Date(`${appointment.date}T${appointment.time || "00:00"}:00`).getTime();
}

function blocksForBarber(state: AppState, barberId: string, targetDate?: string): Array<{ start: number; end: number }> {
  return state.appointments
    .filter((appointment) => {
      if (appointment.barberId !== barberId) return false;
      if (targetDate && appointment.date !== targetDate) return false;
      return !["cancelled", "completed", "no_show"].includes(appointment.status);
    })
    .map((appointment) => {
      const service = state.services.find((item) => item.id === appointment.serviceId);
      const start = appointmentStartMs(appointment);
      return {
        start,
        end: start + (getServiceDurationMinutes(service) + SERVICE_BUFFER_MINUTES) * 60000
      };
    })
    .sort((a, b) => a.start - b.start);
}

function avoidAppointmentBlocks(start: number, durationMinutes: number, blocks: Array<{ start: number; end: number }>): number {
  let proposedStart = start;
  let changed = true;

  while (changed) {
    changed = false;
    const proposedEnd = proposedStart + durationMinutes * 60000;
    const conflict = blocks.find((block) => proposedStart < block.end && proposedEnd > block.start);
    if (conflict) {
      proposedStart = conflict.end;
      changed = true;
    }
  }

  return proposedStart;
}

function barberAvailableAt(state: AppState, barber: Barber, now: number): number {
  if (barber.status === "offline") return Number.POSITIVE_INFINITY;
  if (barber.status === "break") return now + 15 * 60000;
  if (barber.status !== "busy") return now;

  const current = state.queue.find((item) => item.id === barber.currentQueueId);
  const service = current ? getQueueService(state, current) : null;
  const duration = getServiceDurationMinutes(service, current?.estimatedDurationMinutes) + SERVICE_BUFFER_MINUTES;
  const startedAt = barber.serviceStartedAt || current?.serviceStartedAt || current?.startedAt || now;
  return Math.max(now, startedAt + duration * 60000);
}

function getCandidateBarbers(state: AppState, item?: QueueItem): Barber[] {
  const active = state.barbers.filter((barber) => barber.active && barber.status !== "offline");
  if (!item?.preferredBarberId) return active;
  const preferred = active.find((barber) => barber.id === item.preferredBarberId);
  return preferred ? [preferred] : active;
}

export function calculateQueueTimeline(state: AppState, now = Date.now()): QueueTimelineEntry[] {
  const activeTickets = sortTicketsChronologically(state.queue.filter((item) => isActiveTicketStatus(item.status)));
  const availableAt = new Map<string, number>();
  const entries: QueueTimelineEntry[] = [];

  state.barbers
    .filter((barber) => barber.active && barber.status !== "offline")
    .forEach((barber) => availableAt.set(barber.id, barberAvailableAt(state, barber, now)));

  activeTickets.forEach((item, index) => {
    const service = getQueueService(state, item);
    const duration = getServiceDurationMinutes(service, item.estimatedDurationMinutes);
    const candidates = getCandidateBarbers(state, item);

    let selectedBarber = candidates[0] || null;
    let selectedStart = selectedBarber ? availableAt.get(selectedBarber.id) || now : now;

    candidates.forEach((barber) => {
      const baseStart = availableAt.get(barber.id) || now;
      const date = new Date(baseStart);
      const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const blocks = blocksForBarber(state, barber.id, localDate);
      const start = avoidAppointmentBlocks(baseStart, duration + SERVICE_BUFFER_MINUTES, blocks);
      if (!selectedBarber || start < selectedStart) {
        selectedBarber = barber;
        selectedStart = start;
      }
    });

    const estimatedEndAt = selectedStart + duration * 60000;
    if (selectedBarber) {
      availableAt.set(selectedBarber.id, estimatedEndAt + SERVICE_BUFFER_MINUTES * 60000);
    }

    entries.push({
      item,
      position: index + 1,
      estimatedStartAt: selectedStart,
      estimatedEndAt,
      estimatedWaitMinutes: Math.max(0, Math.round((selectedStart - now) / 60000)),
      waitedMinutes: calculateWaitedMinutes(item, now),
      assignedBarberSuggestion: selectedBarber?.name || null,
      assignedBarberId: selectedBarber?.id || null
    });
  });

  return entries;
}

export function calculateNextTurnEstimate(state: AppState, now = Date.now()): NextTurnEstimate {
  const timeline = calculateQueueTimeline(state, now);
  const lastEnd = timeline.reduce((max, entry) => Math.max(max, entry.estimatedEndAt + SERVICE_BUFFER_MINUTES * 60000), now);
  const activeBarbers = state.barbers.filter((barber) => barber.active && barber.status !== "offline");
  const earliestBarberReady = activeBarbers.length
    ? Math.min(...activeBarbers.map((barber) => barberAvailableAt(state, barber, now)))
    : lastEnd;
  const startsAt = timeline.length ? Math.max(earliestBarberReady, lastEnd) : earliestBarberReady;
  return {
    waitMinutes: Math.max(0, Math.round((startsAt - now) / 60000)),
    startsAt
  };
}

function businessDateTime(date: string, time: string): number {
  return new Date(`${date}T${time}:00`).getTime();
}

function roundUpToInterval(timestamp: number, intervalMinutes: number): number {
  const intervalMs = intervalMinutes * 60000;
  return Math.ceil(timestamp / intervalMs) * intervalMs;
}

export function formatTimeInput(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function calculateAvailableSlots(input: {
  state: AppState;
  date: string;
  serviceId: string;
  barberId?: string;
  now?: number;
  limit?: number;
}): AvailableSlot[] {
  const now = input.now || Date.now();
  const service = input.state.services.find((item) => item.id === input.serviceId);
  const duration = getServiceDurationMinutes(service);
  const selectedBarbers = input.state.barbers.filter((barber) => {
    if (!barber.active || barber.status === "offline") return false;
    if (input.barberId) return barber.id === input.barberId;
    return true;
  });
  const limit = input.limit || 6;
  const slots: AvailableSlot[] = [];
  const timeline = calculateQueueTimeline(input.state, now);
  const businessStart = businessDateTime(input.date, DEFAULT_BUSINESS_START);
  const businessEnd = businessDateTime(input.date, DEFAULT_BUSINESS_END);
  const earliest = roundUpToInterval(Math.max(now, businessStart), 5);

  selectedBarbers.forEach((barber) => {
    const barberQueueEnd = timeline
      .filter((entry) => entry.assignedBarberId === barber.id)
      .reduce((max, entry) => Math.max(max, entry.estimatedEndAt + SERVICE_BUFFER_MINUTES * 60000), barberAvailableAt(input.state, barber, now));
    const blocks = blocksForBarber(input.state, barber.id, input.date);
    let cursor = roundUpToInterval(Math.max(earliest, barberQueueEnd, businessStart), 5);
    let producedForBarber = 0;

    while (cursor + duration * 60000 <= businessEnd && producedForBarber < limit) {
      const start = avoidAppointmentBlocks(cursor, duration + SERVICE_BUFFER_MINUTES, blocks);
      const end = start + duration * 60000;
      if (end <= businessEnd) {
        slots.push({
          barberId: barber.id,
          barberName: barber.name,
          time: formatTimeInput(start),
          startsAt: start,
          endsAt: end,
          waitMinutes: Math.max(0, Math.round((start - now) / 60000)),
          peopleBefore: timeline.filter((entry) => entry.assignedBarberId === barber.id && entry.estimatedStartAt < start).length
        });
        producedForBarber += 1;
      }
      cursor = start + 15 * 60000;
    }
  });

  return slots.sort((a, b) => a.startsAt - b.startsAt).slice(0, limit);
}

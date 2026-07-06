import type { Appointment, AppointmentStatus, QueueItem, SessionUser } from "../types";
import { getAppState, mutateAppState } from "./localStore";
import { syncQueueItemNow } from "./cloudSync";
import { createId } from "../utils/id";
import {
  calculateAvailableSlots,
  formatTimeInput,
  generateTicketCode,
  getBusinessPrefix,
  getServiceDurationMinutes,
  nextDailySequence,
  SERVICE_BUFFER_MINUTES
} from "../utils/queueTimeline";
import { sortQueueFIFO } from "../utils/fifo";

function appointmentDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time || "00:00"}:00`);
}

function isClosedAppointment(status: Appointment["status"]): boolean {
  return ["cancelled", "completed", "no_show"].includes(status);
}

function overlaps(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB;
}

export function suggestAppointmentTimes(input: {
  date: string;
  serviceId: string;
  barberId?: string;
  limit?: number;
}) {
  return calculateAvailableSlots({
    state: getAppState(),
    date: input.date,
    serviceId: input.serviceId,
    barberId: input.barberId,
    limit: input.limit || 6
  });
}

export function detectAppointmentConflicts(input: {
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
}): string | null {
  const state = getAppState();
  const service = state.services.find((item) => item.id === input.serviceId);
  const start = appointmentDateTime(input.date, input.time).getTime();
  const end = start + (getServiceDurationMinutes(service) + SERVICE_BUFFER_MINUTES) * 60000;

  const appointmentConflict = state.appointments.some((appointment) => {
    if (appointment.barberId !== input.barberId || appointment.date !== input.date || isClosedAppointment(appointment.status)) {
      return false;
    }
    const appointmentService = state.services.find((item) => item.id === appointment.serviceId);
    const appointmentStart = appointmentDateTime(appointment.date, appointment.time).getTime();
    const appointmentEnd = appointmentStart + (getServiceDurationMinutes(appointmentService) + SERVICE_BUFFER_MINUTES) * 60000;
    return overlaps(start, end, appointmentStart, appointmentEnd);
  });

  if (appointmentConflict) {
    return "Ese horario choca con otra cita del barbero.";
  }

  const slots = calculateAvailableSlots({
    state,
    date: input.date,
    serviceId: input.serviceId,
    barberId: input.barberId,
    limit: 12
  });
  const firstAllowed = slots.find((slot) => slot.barberId === input.barberId);
  if (firstAllowed && start < firstAllowed.startsAt) {
    return `Segun los turnos actuales, el primer horario realista es ${formatTimeInput(firstAllowed.startsAt)}.`;
  }

  return null;
}

export function createAppointment(input: {
  clientName: string;
  clientPhone?: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  source: "manual" | "bot" | "client";
  session?: SessionUser | null;
  status?: AppointmentStatus;
}): Appointment {
  const state = getAppState();
  const service = state.services.find((item) => item.id === input.serviceId && item.active);
  const barber = state.barbers.find((item) => item.id === input.barberId && item.active);
  const clientName = input.clientName.trim() || input.session?.name || "Cliente";

  if (!service) {
    throw new Error("Selecciona un servicio activo.");
  }
  if (!barber) {
    throw new Error("Selecciona un barbero activo.");
  }
  if (!input.date || !input.time) {
    throw new Error("Selecciona fecha y hora.");
  }
  if (appointmentDateTime(input.date, input.time).getTime() < Date.now() - 60000) {
    throw new Error("No puedes agendar una cita en una fecha u hora pasada.");
  }

  const conflict = detectAppointmentConflicts({
    barberId: barber.id,
    serviceId: service.id,
    date: input.date,
    time: input.time
  });
  if (conflict) {
    throw new Error(conflict);
  }

  const appointment: Appointment = {
    id: createId("appointment"),
    barberShopId: "spencer-barber-shop",
    clientId: input.session?.id || null,
    clientName,
    clientPhone: input.clientPhone?.trim() || input.session?.phone || "",
    serviceId: service.id,
    barberId: barber.id,
    date: input.date,
    time: input.time,
    status: input.status || "scheduled",
    source: input.source,
    createdAt: Date.now(),
    checkedInAt: null,
    startedAt: null,
    completedAt: null,
    noShowAt: null,
    graceMinutes: 10,
    mediaReferences: []
  };

  mutateAppState((state) => ({
    ...state,
    appointments: [...state.appointments, appointment]
  }));

  return appointment;
}

export function approveAppointment(appointmentId: string): void {
  mutateAppState((state) => ({
    ...state,
    appointments: state.appointments.map((appointment) =>
      appointment.id === appointmentId
        ? { ...appointment, status: "scheduled" }
        : appointment
    )
  }));
}

export function cancelAppointment(appointmentId: string): void {
  mutateAppState((state) => ({
    ...state,
    appointments: state.appointments.map((appointment) =>
      appointment.id === appointmentId
        ? { ...appointment, status: "cancelled" }
        : appointment
    )
  }));
}

export function startAppointmentNow(appointmentId: string): QueueItem {
  const current = getAppState();
  const appointment = current.appointments.find((item) => item.id === appointmentId);

  if (!appointment) {
    throw new Error("No se encontró la cita.");
  }
  if (appointment.status === "pending") {
    throw new Error("Primero aprueba la cita después de revisar el comprobante de pago.");
  }
  if (isClosedAppointment(appointment.status)) {
    throw new Error("Esta cita ya está cerrada.");
  }

  const barber = current.barbers.find((item) => item.id === appointment.barberId && item.active);
  const service = current.services.find((item) => item.id === appointment.serviceId && item.active);

  if (!barber) {
    throw new Error("El barbero de esta cita no está disponible.");
  }
  if (!service) {
    throw new Error("El servicio de esta cita no está disponible.");
  }
  if (barber.status === "busy" || barber.currentQueueId) {
    throw new Error("Este barbero ya tiene un cliente en atención.");
  }

  const now = Date.now();
  const sequence = nextDailySequence(current.queue, now);
  const ticketCode = generateTicketCode(getBusinessPrefix(current), sequence, now);

  const queueItem: QueueItem = {
    id: createId("ticket"),
    barberShopId: "spencer-barber-shop",
    ticketCode,
    dailySequenceNumber: sequence,
    clientId: appointment.clientId || null,
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone || "",
    whatsapp: appointment.clientPhone || "",
    deviceId: `appointment_${appointment.id}`,
    source: "manual",
    serviceId: service.id,
    serviceName: service.name,
    estimatedDurationMinutes: getServiceDurationMinutes(service),
    preferredBarberId: barber.id,
    assignedBarberId: barber.id,
    status: "in_service",
    note: `appointment:${appointment.id}`,
    notes: "Cita atendida antes de la hora programada.",
    position: sequence,
    createdAt: now,
    waitStartedAt: now,
    joinedAt: now,
    estimatedStartAt: now,
    estimatedEndAt: now + getServiceDurationMinutes(service) * 60000,
    calledAt: now,
    startedAt: now,
    serviceStartedAt: now,
    serviceEndedAt: null,
    finishedAt: null,
    completedAt: null,
    skippedAt: null,
    cancelledAt: null,
    mediaReferences: appointment.mediaReferences || []
  };

  mutateAppState((state) => ({
    ...state,
    queue: sortQueueFIFO([...state.queue, queueItem]),
    appointments: state.appointments.map((item) =>
      item.id === appointment.id
        ? {
            ...item,
            status: "in_service",
            checkedInAt: item.checkedInAt || now,
            startedAt: now
          }
        : item
    ),
    barbers: state.barbers.map((item) =>
      item.id === barber.id
        ? {
            ...item,
            status: "busy",
            currentQueueId: queueItem.id,
            currentClientName: queueItem.clientName,
            serviceStartedAt: now
          }
        : item
    )
  }));
  void syncQueueItemNow(queueItem);

  return queueItem;
}

export function markAppointmentCheckedIn(appointmentId: string): void {
  mutateAppState((state) => ({
    ...state,
    appointments: state.appointments.map((appointment) =>
      appointment.id === appointmentId
        ? { ...appointment, status: "checked_in", checkedInAt: Date.now() }
        : appointment
    )
  }));
}

export function markAppointmentNoShow(appointmentId: string): void {
  mutateAppState((state) => ({
    ...state,
    appointments: state.appointments.map((appointment) =>
      appointment.id === appointmentId
        ? { ...appointment, status: "no_show", noShowAt: Date.now() }
        : appointment
    )
  }));
}

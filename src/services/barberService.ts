import type { Barber, BarberStatus } from "../types";
import { mutateAppState } from "./localStore";
import { createId } from "../utils/id";

export function setBarberStatus(barberId: string, status: BarberStatus): void {
  mutateAppState((state) => ({
    ...state,
    barbers: state.barbers.map((barber) =>
      barber.id === barberId
        ? {
            ...barber,
            status
          }
        : barber
    )
  }));
}

export function addBarber(input: { name: string; phone: string; specialties?: string[] }): void {
  if (!input.name.trim()) {
    throw new Error("El nombre del barbero es obligatorio.");
  }

  const barber: Barber = {
    id: createId("barber"),
    userId: null,
    name: input.name.trim(),
    phone: input.phone.trim(),
    photo: "",
    status: "available",
    currentQueueId: null,
    currentClientName: null,
    serviceStartedAt: null,
    doneToday: 0,
    specialties: input.specialties || [],
    active: true
  };

  mutateAppState((state) => ({
    ...state,
    barbers: [...state.barbers, barber]
  }));
}

export function removeBarber(barberId: string): void {
  mutateAppState((state) => {
    const barber = state.barbers.find((item) => item.id === barberId);
    if (barber?.status === "busy") {
      throw new Error("No puedes eliminar un barbero con servicio activo.");
    }

    const hasFutureAppointments = state.appointments.some(
      (appointment) =>
        appointment.barberId === barberId &&
        appointment.status !== "cancelled" &&
        appointment.status !== "completed" &&
        appointment.status !== "no_show"
    );
    if (hasFutureAppointments) {
      throw new Error("Este barbero tiene citas pendientes.");
    }

    return {
      ...state,
      barbers: state.barbers.filter((item) => item.id !== barberId)
    };
  });
}

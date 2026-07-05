import type { Service } from "../types";
import { mutateAppState } from "./localStore";
import { createId } from "../utils/id";
import { isClosedTicketStatus, normalizeTicketStatus } from "../utils/queueTimeline";

export function addService(input: {
  id?: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  icon: string;
  imageUrl?: string;
  imageStoragePath?: string;
}): string {
  if (!input.name.trim()) {
    throw new Error("El nombre del servicio es obligatorio.");
  }
  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error("El precio debe ser mayor que cero.");
  }
  if (!Number.isFinite(input.duration) || input.duration <= 0) {
    throw new Error("La duración debe ser mayor que cero.");
  }

  const service: Service = {
    id: input.id || createId("service"),
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    duration: input.duration,
    icon: input.icon.trim(),
    imageUrl: input.imageUrl?.trim() || "",
    imageStoragePath: input.imageStoragePath?.trim() || "",
    active: true
  };

  mutateAppState((state) => ({
    ...state,
    services: [...state.services, service]
  }));

  return service.id;
}

export function updateService(serviceId: string, updates: Partial<Omit<Service, "id">>): void {
  mutateAppState((state) => ({
    ...state,
    services: state.services.map((service) => {
      if (service.id !== serviceId) {
        return service;
      }

      return {
        ...service,
        ...updates,
        name: updates.name !== undefined && updates.name.trim() ? updates.name.trim() : service.name,
        description: updates.description !== undefined ? updates.description.trim() : service.description,
        icon: updates.icon !== undefined ? updates.icon.trim() : service.icon,
        imageUrl: updates.imageUrl !== undefined ? updates.imageUrl.trim() : service.imageUrl,
        imageStoragePath: updates.imageStoragePath !== undefined ? updates.imageStoragePath.trim() : service.imageStoragePath
      };
    })
  }));
}

export function removeService(serviceId: string): void {
  mutateAppState((state) => {
    const isInUse = state.queue.some(
      (item) => item.serviceId === serviceId && !isClosedTicketStatus(normalizeTicketStatus(item.status))
    );
    const hasAppointments = state.appointments.some(
      (item) =>
        item.serviceId === serviceId &&
        item.status !== "cancelled" &&
        item.status !== "completed" &&
        item.status !== "no_show"
    );
    if (isInUse || hasAppointments) {
      throw new Error("Este servicio tiene turnos o citas pendientes.");
    }

    return {
      ...state,
      services: state.services.filter((service) => service.id !== serviceId)
    };
  });
}

import type { AppState, Barber, QueueItem, Service } from "../types";
import { calculateQueueTimeline, getServiceDurationMinutes, queueCreatedAt, sortTicketsChronologically } from "./queueTimeline";

export function averageServiceDuration(services: Service[]): number {
  const active = services.filter((service) => service.active);
  if (!active.length) return 25;
  return Math.round(active.reduce((sum, service) => sum + service.duration, 0) / active.length);
}

export function estimateWaitMinutes(index: number, state: AppState): number {
  const timeline = calculateQueueTimeline(state);
  return timeline[index]?.estimatedWaitMinutes || 0;
}

export function getNextQueueItemForBarber(queue: QueueItem[], barber: Barber): QueueItem | null {
  const exactPreference = queue.find(
    (item) => (item.status === "waiting" || item.status === "next" || item.status === "called") && item.preferredBarberId === barber.id
  );
  if (exactPreference) return exactPreference;

  return queue.find(
    (item) => (item.status === "waiting" || item.status === "next" || item.status === "called") && !item.preferredBarberId
  ) || null;
}

export function sortQueueFIFO(queue: QueueItem[]): QueueItem[] {
  return sortTicketsChronologically(queue);
}

export function getEstimatedDuration(item: QueueItem, state: AppState): number {
  const service = state.services.find((entry) => entry.id === item.serviceId);
  return getServiceDurationMinutes(service, item.estimatedDurationMinutes);
}

export function isSameQueueDay(a: QueueItem, b: QueueItem): boolean {
  return new Date(queueCreatedAt(a)).toDateString() === new Date(queueCreatedAt(b)).toDateString();
}

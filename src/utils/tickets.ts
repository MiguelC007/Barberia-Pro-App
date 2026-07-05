import type { QueueItem } from "../types";

export function getTicketClientLabel(item: Pick<QueueItem, "clientName" | "ticketCode" | "dailySequenceNumber">): string {
  const name = item.clientName?.trim();
  if (name) return name;
  if (item.ticketCode) return "Ticket generado";
  return `Turno ${String(item.dailySequenceNumber || 0).padStart(2, "0")}`;
}

export function getTicketCodeLabel(item: Pick<QueueItem, "ticketCode" | "dailySequenceNumber">): string {
  return item.ticketCode || `Turno #${String(item.dailySequenceNumber || 0).padStart(2, "0")}`;
}

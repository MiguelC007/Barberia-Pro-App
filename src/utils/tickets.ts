import type { QueueItem } from "../types";

function ticketOrder(item: Pick<QueueItem, "dailySequenceNumber">): string {
  const order = item.dailySequenceNumber || 1;
  return `#${order}`;
}

export function getTicketClientLabel(item: Pick<QueueItem, "clientName" | "dailySequenceNumber">): string {
  const name = item.clientName?.trim();
  if (name) return name;
  return `Cliente ${ticketOrder(item)}`;
}

export function getTicketCodeLabel(item: Pick<QueueItem, "ticketCode" | "dailySequenceNumber">): string {
  return item.ticketCode || `Ticket ${ticketOrder(item)}`;
}

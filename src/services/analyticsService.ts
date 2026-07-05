import { getAppState } from "./localStore";
import { isActiveTicketStatus, normalizeTicketStatus } from "../utils/queueTimeline";

export function getBasicAnalytics() {
  const state = getAppState();

  return {
    totalQueue: state.queue.length,
    waiting: state.queue.filter((item) => isActiveTicketStatus(normalizeTicketStatus(item.status))).length,
    inService: state.queue.filter((item) => item.status === "in_service").length,
    doneToday: state.barbers.reduce((sum, barber) => sum + barber.doneToday, 0),
    appointments: state.appointments.length,
    services: state.services.length,
    barbers: state.barbers.length,
    paymentsPending: state.payments.filter((payment) => payment.status === "pending").length
  };
}

import type { PaymentSettings, Payment, MediaReference } from "../types";
import { mutateAppState } from "./localStore";
import { createId } from "../utils/id";

export function updatePaymentSettings(settings: PaymentSettings): void {
  if (!settings.bankName.trim() || !settings.accountHolder.trim()) {
    throw new Error("Banco y titular son obligatorios.");
  }
  if (!settings.whatsapp.trim()) {
    throw new Error("Configura un WhatsApp para comprobantes.");
  }

  mutateAppState((state) => ({
    ...state,
    paymentSettings: {
      ...settings,
      bankName: settings.bankName.trim(),
      accountHolder: settings.accountHolder.trim(),
      whatsapp: settings.whatsapp.trim()
    }
  }));
}

export function createPaymentProof(input: { clientName: string; amount: number; proofText?: string; mediaReferences?: MediaReference[] }): Payment {
  if (!input.clientName.trim()) {
    throw new Error("El nombre del cliente es obligatorio.");
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Ingresa un monto de pago mayor que cero.");
  }

  const payment: Payment = {
    id: createId("payment"),
    clientName: input.clientName.trim(),
    amount: input.amount,
    status: "pending",
    proofText: input.proofText?.trim() || "Comprobante enviado por WhatsApp/manual",
    createdAt: Date.now(),
    confirmedAt: null,
    mediaReferences: input.mediaReferences || []
  };

  mutateAppState((state) => ({
    ...state,
    payments: [...state.payments, payment]
  }));

  return payment;
}

export function confirmPayment(paymentId: string): void {
  mutateAppState((state) => ({
    ...state,
    payments: state.payments.map((payment) =>
      payment.id === paymentId ? { ...payment, status: "confirmed", confirmedAt: Date.now() } : payment
    )
  }));
}

export function rejectPayment(paymentId: string): void {
  mutateAppState((state) => ({
    ...state,
    payments: state.payments.map((payment) =>
      payment.id === paymentId ? { ...payment, status: "rejected", confirmedAt: null } : payment
    )
  }));
}

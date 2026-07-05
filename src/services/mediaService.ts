import type { MediaReference } from "../types";
import { mutateAppState } from "./localStore";
import { createId } from "../utils/id";

function withAttachmentTarget(media: MediaReference[], attachedTo: NonNullable<MediaReference["attachedTo"]>): MediaReference[] {
  return media.map((entry) => ({ ...entry, attachedTo }));
}

async function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

export async function createMediaReference(input: {
  file: Blob;
  name: string;
  type: MediaReference["type"];
  attachedTo?: MediaReference["attachedTo"];
  preferObjectUrl?: boolean;
}): Promise<MediaReference> {
  const useObjectUrl = input.preferObjectUrl && input.type === "video";
  const url = useObjectUrl ? URL.createObjectURL(input.file) : await fileToDataUrl(input.file);

  return {
    id: createId("media"),
    type: input.type,
    name: input.name,
    url,
    createdAt: Date.now(),
    attachedTo: input.attachedTo
  };
}

export function attachMediaToTicket(ticketId: string, media: MediaReference[]): void {
  mutateAppState((state) => ({
    ...state,
    queue: state.queue.map((item) =>
      item.id === ticketId
        ? {
            ...item,
            mediaReferences: [...(item.mediaReferences || []), ...withAttachmentTarget(media, "ticket")]
          }
        : item
    )
  }));
}

export function attachMediaToAppointment(appointmentId: string, media: MediaReference[]): void {
  mutateAppState((state) => ({
    ...state,
    appointments: state.appointments.map((item) =>
      item.id === appointmentId
        ? {
            ...item,
            mediaReferences: [...(item.mediaReferences || []), ...withAttachmentTarget(media, "appointment")]
          }
        : item
    )
  }));
}

export function attachMediaToPayment(paymentId: string, media: MediaReference[]): void {
  mutateAppState((state) => ({
    ...state,
    payments: state.payments.map((item) =>
      item.id === paymentId
        ? {
            ...item,
            mediaReferences: [...(item.mediaReferences || []), ...withAttachmentTarget(media, "payment")]
          }
        : item
    )
  }));
}

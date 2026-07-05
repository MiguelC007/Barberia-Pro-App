export function minutesToText(minutes: number): string {
  const safe = Math.max(0, Math.round(Number.isFinite(minutes) ? minutes : 0));
  if (safe < 60) return `${safe} min`;

  const hours = Math.floor(safe / 60);
  const rest = safe % 60;

  return rest ? `${hours} h ${String(rest).padStart(2, "0")} min` : `${hours} h`;
}

export function formatElapsed(startedAt?: number | null, now = Date.now()): string {
  if (!startedAt) return "0 min";
  const minutes = Math.max(0, Math.floor((now - startedAt) / 60000));
  return minutesToText(minutes);
}

export function timeLabel(timestamp?: number | null): string {
  if (!timestamp) return "Sin horario";

  return new Date(timestamp)
    .toLocaleTimeString("es-HN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })
    .replace(/\s*a\.\s*m\./i, " a. m.")
    .replace(/\s*p\.\s*m\./i, " p. m.");
}

export function formatTimeInputLabel(value?: string | null): string {
  if (!value) return "Sin horario";

  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Math.min(23, Math.max(0, Number(rawHour) || 0));
  const minute = Math.min(59, Math.max(0, Number(rawMinute) || 0));
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return timeLabel(date.getTime());
}

export function todayInputValue(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function nextAppointmentDateInputValue(closeHour = 20): string {
  const date = new Date();
  if (date.getHours() >= closeHour) {
    date.setDate(date.getDate() + 1);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function currentTimeInputValue(addHours = 1): string {
  const date = new Date();
  date.setHours(date.getHours() + addHours);
  return `${String(date.getHours()).padStart(2, "0")}:00`;
}

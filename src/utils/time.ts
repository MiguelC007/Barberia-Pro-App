export function formatElapsed(startedAt?: number | null): string {
  if (!startedAt) return "00:00";
  const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

export function minutesToText(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  if (safe < 60) return `${safe}m`;
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${hours}h${rest ? ` ${rest}m` : ""}`;
}

export function timeLabel(timestamp?: number | null): string {
  if (!timestamp) return "--:--";
  return new Date(timestamp).toLocaleTimeString("es-HN", {
    hour: "numeric",
    minute: "2-digit"
  });
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

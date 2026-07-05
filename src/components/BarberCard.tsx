import type { Barber } from "../types";
import { initials } from "../utils/format";
import { formatElapsed } from "../utils/time";

export function barberStatusLabel(status: Barber["status"]): string {
  const labels: Record<Barber["status"], string> = {
    available: "Disponible",
    busy: "Ocupado",
    break: "En descanso",
    offline: "Fuera de servicio"
  };
  return labels[status];
}

export function BarberCard({ barber, now = Date.now() }: { barber: Barber; now?: number }) {
  const tone = barber.status === "available" ? "success" : barber.status === "busy" ? "danger" : "warning";

  return (
    <article className="mini-card barber-mini-card">
      <div className="avatar">{initials(barber.name)}</div>
      <div>
        <strong>{barber.name}</strong>
        <p>
          {barber.status === "busy"
            ? `Atiende a: ${barber.currentClientName || "Cliente por confirmar"} · ${formatElapsed(barber.serviceStartedAt, now)}`
            : barber.specialties.join(" · ") || "Barbero"}
        </p>
        <span className={`badge badge-${tone}`}>{barberStatusLabel(barber.status)}</span>
      </div>
    </article>
  );
}

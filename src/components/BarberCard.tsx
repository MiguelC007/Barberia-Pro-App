import type { Barber } from "../types";
import { initials } from "../utils/format";
import { formatElapsed } from "../utils/time";

export function BarberCard({ barber, now = Date.now() }: { barber: Barber; now?: number }) {
  const tone = barber.status === "available" ? "success" : barber.status === "busy" ? "danger" : "warning";

  return (
    <article className="mini-card">
      <div className="avatar">{initials(barber.name)}</div>
      <div>
        <strong>{barber.name}</strong>
        <p>
          {barber.status === "busy"
            ? `Atiende a: ${barber.currentClientName || "Cliente por confirmar"} · ${formatElapsed(barber.serviceStartedAt, now)}`
            : barber.specialties.join(" · ") || "Barbero"}
        </p>
        <span className={`badge badge-${tone}`}>
          {barber.status === "available" ? "Disponible" : barber.status === "busy" ? "Ocupado" : barber.status === "break" ? "Descanso" : "Fuera de línea"}
        </span>
      </div>
    </article>
  );
}

import type { Barber } from "../types";
import { initials } from "../utils/format";
import { formatElapsed } from "../utils/time";

export function BarberCard({ barber }: { barber: Barber }) {
  const tone = barber.status === "available" ? "success" : barber.status === "busy" ? "danger" : "warning";

  return (
    <article className="mini-card">
      <div className="avatar">{initials(barber.name)}</div>
      <div>
        <strong>{barber.name}</strong>
        <p>{barber.status === "busy" ? `Atiende a ${barber.currentClientName || "cliente"} · ${formatElapsed(barber.serviceStartedAt)}` : barber.specialties.join(" · ") || "Barbero"}</p>
        <span className={`badge badge-${tone}`}>
          {barber.status === "available" ? "Disponible" : barber.status === "busy" ? "Ocupado" : barber.status === "break" ? "Descanso" : "Offline"}
        </span>
      </div>
    </article>
  );
}

import type { Service } from "../types";
import { moneyLempiras } from "../utils/format";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="mini-card">
      <div className="icon-bubble">{service.icon}</div>
      <div>
        <strong>{service.name}</strong>
        <p>{service.description}</p>
        <small>{moneyLempiras(service.price)} · {service.duration} min</small>
      </div>
    </article>
  );
}

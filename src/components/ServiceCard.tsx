import type { Service } from "../types";
import { moneyLempiras } from "../utils/format";
import { getServiceImage } from "../utils/serviceImages";

export function ServiceCard({ service }: { service: Service }) {
  const label = service.icon?.trim();

  return (
    <article className="service-card-pro">
      <div className="service-card-media">
        <img src={getServiceImage(service)} alt={service.name} loading="lazy" />
        {label ? <span className="service-card-badge">{label}</span> : null}
      </div>

      <div className="service-card-body">
        <strong>{service.name}</strong>
        <p>{service.description}</p>
        <div className="service-card-meta">
          <span>{moneyLempiras(service.price)}</span>
          <span>{service.duration} min</span>
        </div>
      </div>
    </article>
  );
}

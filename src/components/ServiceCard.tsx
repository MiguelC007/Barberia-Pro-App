import type { Service } from "../types";
import { moneyLempiras } from "../utils/format";
import { getServiceImage } from "../utils/serviceImages";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="service-card-pro">
      <div className="service-card-media">
        <img src={getServiceImage(service)} alt={service.name} loading="lazy" />
        <span className="service-card-badge">{service.icon}</span>
      </div>

      <div className="service-card-body">
        <strong>{service.name}</strong>
        <p>{service.description}</p>
        <small>{moneyLempiras(service.price)} · {service.duration} min</small>
      </div>
    </article>
  );
}

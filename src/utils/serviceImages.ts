import type { Service } from "../types";

function safeAccent(service: Service): string {
  const seed = `${service.name || "Servicio"}${service.icon || "SB"}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = seed.charCodeAt(index) + ((hash << 5) - hash);
  }

  const accents = ["#f97316", "#f59e0b", "#fb923c", "#fdba74"];
  return accents[Math.abs(hash) % accents.length];
}

export function getServiceImage(service: Service): string {
  if (service.imageUrl?.trim()) {
    return service.imageUrl;
  }

  const accent = safeAccent(service);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#10131c" />
          <stop offset="52%" stop-color="#1f2430" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
        <radialGradient id="glow" cx="34%" cy="28%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.24)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" />
      <rect width="1200" height="900" fill="url(#glow)" opacity="0.34" />
      <circle cx="1010" cy="168" r="132" fill="rgba(255,255,255,0.09)" />
      <circle cx="190" cy="690" r="190" fill="rgba(255,255,255,0.06)" />
      <path d="M390 620 822 286" stroke="rgba(255,255,255,0.22)" stroke-width="34" stroke-linecap="round" />
      <path d="M434 286 866 620" stroke="rgba(255,255,255,0.16)" stroke-width="34" stroke-linecap="round" />
      <circle cx="374" cy="650" r="62" fill="rgba(2,6,23,0.38)" stroke="rgba(255,255,255,0.18)" stroke-width="14" />
      <circle cx="890" cy="650" r="62" fill="rgba(2,6,23,0.38)" stroke="rgba(255,255,255,0.18)" stroke-width="14" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

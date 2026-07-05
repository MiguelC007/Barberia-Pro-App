import type { Service } from "../types";

function placeholderLabel(service: Service): string {
  return service.name?.trim() || "Servicio";
}

const basePlaceholderStart = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#131318" />
        <stop offset="55%" stop-color="#25252d" />
        <stop offset="100%" stop-color="#f97316" />
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)" />
    <circle cx="980" cy="160" r="125" fill="rgba(255,255,255,0.08)" />
    <circle cx="220" cy="620" r="160" fill="rgba(255,255,255,0.05)" />
`;

const basePlaceholderEnd = `
  </svg>
`;

export function getServiceImage(service: Service): string {
  if (service.imageUrl?.trim()) {
    return service.imageUrl;
  }

  const svg = `
    ${basePlaceholderStart}
    <text x="90" y="390" fill="#ffffff" font-family="Arial, sans-serif" font-size="76" font-weight="700">${placeholderLabel(service)}</text>
    <text x="90" y="470" fill="#fed7aa" font-family="Arial, sans-serif" font-size="34">Spencer Barber Shop</text>
    <text x="90" y="528" fill="#fde68a" font-family="Arial, sans-serif" font-size="28">${service.duration} min · L ${service.price}</text>
    ${basePlaceholderEnd}
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

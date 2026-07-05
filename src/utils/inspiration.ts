import type { InspirationItem } from "../types";

export const defaultInspirationItems: InspirationItem[] = [
  {
    id: "trend_low_fade",
    title: "Low Fade",
    description: "Desvanecido bajo, limpio y elegante.",
    imageUrl: "",
    imageStoragePath: "",
    active: true
  },
  {
    id: "trend_mid_fade",
    title: "Mid Fade",
    description: "Degradado medio con acabado moderno.",
    imageUrl: "",
    imageStoragePath: "",
    active: true
  },
  {
    id: "trend_taper_fade",
    title: "Taper Fade",
    description: "Perfilado suave en laterales y nuca.",
    imageUrl: "",
    imageStoragePath: "",
    active: true
  },
  {
    id: "trend_french_crop",
    title: "French Crop",
    description: "Corte práctico con textura frontal.",
    imageUrl: "",
    imageStoragePath: "",
    active: true
  },
  {
    id: "trend_beard_cut",
    title: "Corte + barba",
    description: "Look completo con barba perfilada.",
    imageUrl: "",
    imageStoragePath: "",
    active: true
  },
  {
    id: "trend_burst_fade",
    title: "Burst Fade",
    description: "Fade circular moderno alrededor de la oreja.",
    imageUrl: "",
    imageStoragePath: "",
    active: true
  }
];

export function getInspirationItems(items?: InspirationItem[]): InspirationItem[] {
  return (items?.length ? items : defaultInspirationItems).filter((item) => item.active !== false);
}

export function getEditableInspirationItems(items?: InspirationItem[]): InspirationItem[] {
  return items?.length ? items : defaultInspirationItems;
}

export function getInspirationImage(item: InspirationItem): string {
  if (item.imageUrl?.trim()) {
    return item.imageUrl;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" role="img">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="55%" stop-color="#202734" />
          <stop offset="100%" stop-color="#f97316" />
        </linearGradient>
        <radialGradient id="glow" cx="32%" cy="24%" r="72%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.22)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="900" height="900" fill="url(#bg)" />
      <rect width="900" height="900" fill="url(#glow)" opacity="0.32" />
      <circle cx="720" cy="180" r="138" fill="rgba(255,255,255,0.10)" />
      <circle cx="205" cy="705" r="180" fill="rgba(255,255,255,0.07)" />
      <path d="M282 620 630 270" stroke="rgba(255,255,255,0.28)" stroke-width="34" stroke-linecap="round" />
      <path d="M318 270 666 620" stroke="rgba(255,255,255,0.18)" stroke-width="34" stroke-linecap="round" />
      <circle cx="250" cy="662" r="58" fill="rgba(2,6,23,0.42)" stroke="rgba(255,255,255,0.20)" stroke-width="12" />
      <circle cx="704" cy="662" r="58" fill="rgba(2,6,23,0.42)" stroke="rgba(255,255,255,0.20)" stroke-width="12" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function moneyLempiras(value: number): string {
  return `L${Number(value || 0).toLocaleString("es-HN")}`;
}

export function maskAccount(value: string): string {
  const clean = value.replace(/\s/g, "");
  if (clean.length <= 4) return "****0000";
  return `****${clean.slice(-4)}`;
}

export function whatsappLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
}

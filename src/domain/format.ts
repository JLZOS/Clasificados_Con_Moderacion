const priceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number): string {
  return price === 0 ? "Gratis" : priceFormatter.format(price);
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - date.getTime());
  if (diff < MINUTE) return "hace un momento";
  if (diff < HOUR) return `hace ${Math.floor(diff / MINUTE)} min`;
  if (diff < DAY) return `hace ${Math.floor(diff / HOUR)} h`;
  const days = Math.floor(diff / DAY);
  if (days < 7) return days === 1 ? "hace 1 día" : `hace ${days} días`;
  return dateFormatter.format(date);
}

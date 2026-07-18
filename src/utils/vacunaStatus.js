// Vaccination-card status, computed from the next-booster date (fecha_refuerzo).
//   vencida  -> booster date is in the past
//   proxima  -> booster due within the next 30 days
//   al-dia   -> booster date is further out
//   sin-fecha -> no booster date recorded
const DAY = 24 * 60 * 60 * 1000;

export function vacunaStatus(fechaRefuerzo, now = new Date()) {
  if (!fechaRefuerzo) {
    return { key: "sin-fecha", label: "Sin refuerzo", tone: "neutral" };
  }

  const due = new Date(fechaRefuerzo);
  if (Number.isNaN(due.getTime())) {
    return { key: "sin-fecha", label: "Sin refuerzo", tone: "neutral" };
  }

  const diffDays = Math.ceil((due.getTime() - now.getTime()) / DAY);

  if (diffDays < 0) {
    return { key: "vencida", label: "Vencida", tone: "danger" };
  }
  if (diffDays <= 30) {
    return { key: "proxima", label: "Próxima", tone: "warning" };
  }
  return { key: "al-dia", label: "Al día", tone: "ok" };
}

// Pretty date for display; falls back to the raw value if unparseable.
export function formatFecha(value) {
  if (!value) return null;
  // Date-only strings ("YYYY-MM-DD") parse as UTC midnight, which can
  // display as the previous day in timezones behind UTC — anchor to local
  // midnight instead. Full timestamps parse as-is.
  const isDateOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const d = new Date(isDateOnly ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Prices are Dominican pesos throughout the app.
export function formatRD(amount) {
  const n = Number(amount || 0);
  return `RD$${n.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`;
}

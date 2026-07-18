const API_URL = import.meta.env.VITE_API_URL || "";
const API_BASE = `${API_URL}/api/admin`;

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(res) {
  let message = "No se pudo completar la operación.";
  try {
    const body = await res.json();
    if (body?.message) message = body.message;
  } catch {
    // ignore non-JSON error bodies
  }
  const error = new Error(message);
  error.status = res.status;
  return error;
}

export async function updateAppointmentTypePrice(id, price) {
  const res = await fetch(`${API_BASE}/appointment-types/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ price }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function updateAggressivePetSurcharge(aggressivePetSurcharge) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ aggressivePetSurcharge }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

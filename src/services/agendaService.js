// Secretary agenda data layer (staff-facing).
// All endpoints are guarded server-side by a staff role (ADMIN/DOCTOR/STAFF);
// unlike the client portal these are NOT scoped to a single client.
//
// Backend contract (pending — build later):
//
//   GET  /api/agenda/citas?estado=&fecha=YYYY-MM-DD
//     -> [{ id, mascotaId, mascotaNombre, clienteId, clienteNombre,
//           servicio, prioridad, fecha: "YYYY-MM-DD", hora: "HH:mm",
//           motivo, estado, createdAt }]
//        estado:    "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA"
//        prioridad: "NORMAL" | "ALTA" | "URGENTE"
//
//   POST  /api/agenda/citas
//     body: { mascotaId, servicio, prioridad, fecha, hora, motivo }
//     Secretary-created citas may start CONFIRMADA (client-created start PENDIENTE).
//
//   PATCH /api/agenda/citas/:id/confirmar   PENDIENTE -> CONFIRMADA
//   PATCH /api/agenda/citas/:id/cancelar    PENDIENTE|CONFIRMADA -> CANCELADA
//   PATCH /api/agenda/citas/:id/completar   CONFIRMADA -> COMPLETADA
//
// Cancel/complete are state transitions (PATCH), never DELETE — the secretary
// view needs the full history.
const API_URL = import.meta.env.VITE_API_URL || "";
const API_BASE = `${API_URL}/api/agenda`;

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

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

async function send(path, method, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export const getCitas = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v)
  ).toString();
  return get(`/citas${qs ? `?${qs}` : ""}`);
};

export const crearCita = (payload) => send("/citas", "POST", payload);
export const confirmarCita = (id) => send(`/citas/${id}/confirmar`, "PATCH");
export const cancelarCita = (id) => send(`/citas/${id}/cancelar`, "PATCH");
export const completarCita = (id) => send(`/citas/${id}/completar`, "PATCH");

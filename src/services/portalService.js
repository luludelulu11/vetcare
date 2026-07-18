// Client-portal data layer. All calls are scoped server-side to the
// logged-in client (the token's client_id), so there is nothing to filter here.
const API_URL = import.meta.env.VITE_API_URL || "";
const API_BASE = `${API_URL}/api/portal`;

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseError(res) {
  let message = "No se pudo cargar la información.";
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

async function getAbsolute(url) {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// Not under /api/portal — shared by the staff and client booking flows.
export const getAppointmentTypes = () => getAbsolute(`${API_URL}/api/appointment-types`);

async function send(path, method, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/* ---------- Mascotas ---------- */
export const getMisMascotas = () => get("/mascotas");
export const getMiMascota = (id) => get(`/mascotas/${id}`);
export const getMiMascotaConsultas = (id) => get(`/mascotas/${id}/consultas`);
export const crearMascota = (payload) => send("/mascotas", "POST", payload);
export const getMiPerfil = () => get("/perfil");

export async function subirFotoPerfil(file) {
  const formData = new FormData();
  formData.append("foto", file);

  const res = await fetch(`${API_BASE}/perfil/foto`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/* ---------- Citas ----------
   Backend contract (pending):

   GET  /api/portal/citas
     -> [{ id, mascotaId, mascotaNombre, servicio, prioridad,
           fecha: "YYYY-MM-DD", hora: "HH:mm", motivo,
           estado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA" }]

   POST /api/portal/citas
     body: { mascotaId, servicio, prioridad, fecha, hora, motivo }
     Always created as estado PENDIENTE — staff confirms from the agenda.

   PATCH /api/portal/citas/:id/cancelar
     Only allowed while estado is PENDIENTE or CONFIRMADA and fecha is future.
*/
export const getMisCitas = () => get("/citas");
export const crearCita = (payload) => send("/citas", "POST", payload);
export const cancelarCita = (id) => send(`/citas/${id}/cancelar`, "PATCH");

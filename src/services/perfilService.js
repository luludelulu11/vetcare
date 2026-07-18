// Staff's own profile (username/email/name/photo). Distinct from
// portalService.js, which is the client-portal equivalent scoped by client_id.
const API_URL = import.meta.env.VITE_API_URL || "";
const API_BASE = `${API_URL}/api`;

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

export async function getPerfil() {
  const res = await fetch(`${API_BASE}/perfil`, { headers: authHeaders() });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

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

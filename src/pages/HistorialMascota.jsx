import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./historialMascota.css";
import Swal from "sweetalert2";
import { isDemoMode } from "../utils/demoMode";
import { demoClientes } from "../mock/demoData";


const API_URL = "http://localhost:5000";

const VISIT_TYPE_LABELS = {
  vac: "Vacuna",
  gen: "Examen general",
  ill: "Enfermedad",
  sur: "Cirugía",
  med: "Medicación",
  den: "Dental",
  rou: "Control rutinario",
  eme: "Emergencia",
  emb: "Embarazo",
};

function normalizeVisitTypes(tipos, tiposDetalle) {
  if (Array.isArray(tiposDetalle) && tiposDetalle.length > 0) {
    return tiposDetalle
      .map((item) => item?.nombre || VISIT_TYPE_LABELS[item?.codigo] || item?.codigo)
      .filter(Boolean)
      .join(", ");
  }

  if (!tipos) return "Sin tipo";

  let parsed = tipos;

  if (typeof tipos === "string") {
    try {
      parsed = JSON.parse(tipos);
    } catch {
      parsed = tipos;
    }
  }

  if (Array.isArray(parsed)) {
    return parsed.map((type) => VISIT_TYPE_LABELS[type] || type).join(", ");
  }

  return VISIT_TYPE_LABELS[parsed] || parsed;
}

export default function HistorialMascota() {
  const navigate = useNavigate();
  const { mascotaId } = useParams();

  const [consultas, setConsultas] = useState([]);
  const [mascotaInfo, setMascotaInfo] = useState(null);
  const [clienteInfo, setClienteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    raza: "",
    edad: "",
    sexo: "",
    peso: "",
    observaciones: "",
  });

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

         if (isDemoMode) {
        setHistorialMascota(demoHistorialMascota);
        setLoading(false);
        return;
      }

        const [mascotasRes, clientesRes, historialRes] = await Promise.all([
          fetch(`${API_URL}/api/mascotas`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/api/clientes`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/api/mascotas/${mascotaId}/consultas`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (
          mascotasRes.status === 401 ||
          clientesRes.status === 401 ||
          historialRes.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const mascotasRaw = await mascotasRes.text();
        const clientesRaw = await clientesRes.text();
        const historialRaw = await historialRes.text();

        let mascotasData = [];
        let clientesData = [];
        let historialData = [];

        try {
          mascotasData = mascotasRaw ? JSON.parse(mascotasRaw) : [];
        } catch {
          throw new Error("Invalid JSON while loading pets.");
        }

        try {
          clientesData = clientesRaw ? JSON.parse(clientesRaw) : [];
        } catch {
          throw new Error("Invalid JSON while loading clients.");
        }

        try {
          historialData = historialRaw ? JSON.parse(historialRaw) : [];
        } catch {
          throw new Error("Invalid JSON while loading clinical history.");
        }

        if (!mascotasRes.ok) {
          throw new Error(mascotasData?.message || "Could not load pets.");
        }

        if (!clientesRes.ok) {
          throw new Error(clientesData?.message || "Could not load clients.");
        }

        if (!historialRes.ok) {
          throw new Error(
            historialData?.message || "Could not load clinical history."
          );
        }

        if (!Array.isArray(historialData)) {
          throw new Error("Clinical history response is not an array.");
        }

        const mascota =
          mascotasData.find(
            (item) =>
              String(
                item.id ??
                  item.Id ??
                  item.ID ??
                  item.mascotaId ??
                  item.MascotaId ??
                  item._id ??
                  ""
              ) === String(mascotaId)
          ) || null;

        setMascotaInfo(mascota);

        if (mascota) {
          setForm({
            nombre: mascota.name ?? mascota.nombre ?? "",
            raza: mascota.breed ?? mascota.raza ?? "",
            edad: mascota.age_years ?? mascota.edad ?? "",
            sexo:
              mascota.sex === "MALE"
                ? "Macho"
                : mascota.sex === "FEMALE"
                ? "Hembra"
                : mascota.sexo ?? "",
            peso: mascota.weight_kg ?? mascota.peso ?? "",
            observaciones: mascota.observations ?? mascota.observaciones ?? "",
          });
        }

        const clienteId =
          mascota?.client_id ??
          mascota?.clienteId ??
          mascota?.cliente_id ??
          "";

        const cliente =
          clientesData.find(
            (c) =>
              String(
                c.id ??
                  c.Id ??
                  c.ID ??
                  c.clienteId ??
                  c.ClienteId ??
                  c._id ??
                  ""
              ) === String(clienteId)
          ) || null;

        setClienteInfo(cliente);
        setConsultas(historialData);
      } catch (err) {
        console.error(err);
        setError(err.message || "Could not load clinical history.");
      } finally {
        setLoading(false);
      }
    };

    if (mascotaId) {
      cargarHistorial();
    }
  }, [mascotaId, navigate]);

  const mascotaNombre = mascotaInfo?.name ?? mascotaInfo?.nombre ?? "No name";
  const mascotaRaza = mascotaInfo?.breed ?? mascotaInfo?.raza ?? "No breed";
  const mascotaEdad = mascotaInfo?.age_years ?? mascotaInfo?.edad ?? "No age";
  const mascotaEstado = mascotaInfo?.estado ?? "activo";

  const clienteNombre =
    clienteInfo?.nombre ||
    `${clienteInfo?.first_name ?? ""} ${clienteInfo?.last_name ?? ""}`.trim() ||
    "No owner";

  const clienteTelefono =
    clienteInfo?.telefono ??
    clienteInfo?.Telefono ??
    clienteInfo?.telefono2 ??
    clienteInfo?.Telefono2 ??
    clienteInfo?.tel ??
    clienteInfo?.tel2 ??
    clienteInfo?.phone_primary ??
    "—";

  const ultimaConsulta = useMemo(() => {
    if (!consultas.length) return "—";
    return consultas[0]?.visit_at || consultas[0]?.fecha || "—";
  }, [consultas]);

  const formatDateTime = (date) => {
    if (!date) return "No date";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleString("es-DO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatShortDate = (date) => {
    if (!date || date === "—") return "—";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("es-DO", {
      day: "numeric",
      month: "short",
    });
  };

  const getInitial = (text = "") => {
    return text.trim().charAt(0).toUpperCase() || "?";
  };

  const getVisitTypeClass = (label) => {
    const value = String(label || "").toLowerCase();

    if (value.includes("cirug")) return "hcd-badge--surgery";
    if (value.includes("seguimiento")) return "hcd-badge--follow";
    return "hcd-badge--soft";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveMascota = async () => {
    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/mascotas/${mascotaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "No se pudo actualizar la mascota.");
      }

      setMascotaInfo((prev) =>
        prev
          ? {
              ...prev,
              name: form.nombre,
              nombre: form.nombre,
              breed: form.raza,
              raza: form.raza,
              age_years: form.edad,
              edad: form.edad,
              sex:
                form.sexo === "Macho"
                  ? "MALE"
                  : form.sexo === "Hembra"
                  ? "FEMALE"
                  : form.sexo,
              sexo: form.sexo,
              weight_kg: form.peso,
              peso: form.peso,
              observations: form.observaciones,
              observaciones: form.observaciones,
            }
          : prev
      );

      await Swal.fire({
        icon: "success",
        title: "Listo",
        text: data.message || "Mascota actualizada correctamente.",
        timer: 2200,
        showConfirmButton: false,
      });
      setEditMode(false);
    } catch (err) {
      Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message || "Error actualizando mascota.",
      confirmButtonColor: "#dc2626",
    });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMascota = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/mascotas/${mascotaId}/toggle`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "No se pudo cambiar el estado.");
      }

      window.location.reload();
    } catch (err) {
      alert(err.message || "Error cambiando estado.");
    }
  };

  return (
    <div className="hcd-page">
      <div className="hcd-container">
        <header className="hcd-hero">
          <button
            type="button"
            className="hcd-back-btn"
            onClick={() => navigate(-1)}
          >
            <span className="hcd-back-arrow">←</span>
            <span>volver</span>
          </button>

          <div className="hcd-hero-copy">
            <h1>Historial de mascota</h1>
            <p>Detalle clínico del paciente</p>
          </div>
        </header>

        {loading ? (
          <div className="hcd-state-card">Loading clinical history...</div>
        ) : error ? (
          <div className="hcd-state-card hcd-state-card--error">{error}</div>
        ) : (
          <>
            <section className="hcd-summary-grid">
              <article className="hcd-info-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "12px",
                  }}
                >
                  <h3 className="hcd-card-label">Mascota</h3>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button className="edit"
                      type="button"
                      onClick={() => setEditMode((prev) => !prev)}
                      style={{
                        background: "#0f766e",
                        color: "#fff",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {editMode ? "Cancelar" : "Editar"}
                    </button>

                    <button className="deac"
                      type="button"
                      onClick={handleToggleMascota}
                      style={{
                        background:
                          mascotaEstado === "activo" ? "#fee2e2" : "#d1fae5",
                        color:
                          mascotaEstado === "activo" ? "#991b1b" : "#065f46",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {mascotaEstado === "activo" ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </div>

                {!editMode ? (
                  <div className="hcd-pet-block">
                    <div className="hcd-avatar">{getInitial(mascotaNombre)}</div>

                    <div className="hcd-pet-copy">
                      <h2>{mascotaNombre}</h2>
                      <p>
                        {mascotaRaza} · {mascotaEdad} años
                      </p>

                      <span
                        style={{
                          background:
                            mascotaEstado === "activo" ? "#d1fae5" : "#fee2e2",
                          color:
                            mascotaEstado === "activo" ? "#065f46" : "#991b1b",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          display: "inline-block",
                          marginTop: "6px",
                        }}
                      >
                        {mascotaEstado === "activo" ? "Activa" : "Inactiva"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />

                    <input
                      type="text"
                      name="raza"
                      placeholder="Raza"
                      value={form.raza}
                      onChange={handleChange}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />

                    <input
                      type="number"
                      name="edad"
                      placeholder="Edad"
                      value={form.edad}
                      onChange={handleChange}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />

                    <select
                      name="sexo"
                      value={form.sexo}
                      onChange={handleChange}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    >
                      <option value="">Selecciona sexo</option>
                      <option value="Macho">Macho</option>
                      <option value="Hembra">Hembra</option>
                    </select>

                    <input
                      type="number"
                      name="peso"
                      placeholder="Peso"
                      value={form.peso}
                      onChange={handleChange}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />

                    <textarea
                      name="observaciones"
                      placeholder="Observaciones"
                      value={form.observaciones}
                      onChange={handleChange}
                      rows={4}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={handleSaveMascota}
                        disabled={saving}
                        style={{
                          background: "#0f766e",
                          color: "#fff",
                          border: "none",
                          padding: "10px 16px",
                          borderRadius: "12px",
                          cursor: "pointer",
                        }}
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </div>
                )}
              </article>

              <article className="hcd-info-card">
                <h3 className="hcd-card-label">Propietario</h3>

                <div className="hcd-owner-grid">
                  <div className="hcd-owner-row">
                    <span>Cliente</span>
                    <strong>{clienteNombre}</strong>
                  </div>

                  <div className="hcd-owner-row">
                    <span>Teléfono</span>
                    <strong>{clienteTelefono}</strong>
                  </div>
                </div>

                <div className="hcd-stats-grid">
                  <div className="hcd-stat-box">
                    <strong>{consultas.length}</strong>
                    <span>consultas</span>
                  </div>

                  <div className="hcd-stat-box">
                    <strong>{formatShortDate(ultimaConsulta)}</strong>
                    <span>última visita</span>
                  </div>
                </div>
              </article>
            </section>

            <section className="hcd-consultas-section">
              <div className="hcd-section-head">
                <h2>Consultas clínicas</h2>
                <span className="hcd-count-pill">
                  {consultas.length} consulta{consultas.length !== 1 ? "s" : ""}
                </span>
              </div>

              {consultas.length === 0 ? (
                <p className="hcd-empty-text">
                  No clinical history was found for this pet.
                </p>
              ) : (
                <div className="hcd-consultation-list">
                  {consultas.map((consulta) => {
                    const tipoLabel = normalizeVisitTypes(
                      consulta.tipos_consulta,
                      consulta.tipos_consulta_detalle
                    );

                    return (
                      <article key={consulta.id} className="hcd-consultation-row">
                        <div className="hcd-consultation-left">
                          <h3>{consulta.reason || "Sin motivo"}</h3>
                          <p>{formatDateTime(consulta.visit_at)}</p>
                        </div>

                        <div className="hcd-consultation-right">
                          <span className="hcd-badge hcd-badge--doctor">
                            {consulta.doctor || "Sin doctor"}
                          </span>

                          <span
                            className={`hcd-badge ${getVisitTypeClass(tipoLabel)}`}
                          >
                            {tipoLabel}
                          </span>

                          <button
                            type="button"
                            className="hcd-chevron-btn"
                            onClick={() => navigate(`/consulta/${consulta.id}`)}
                          >
                            ›
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
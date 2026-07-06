import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import "./consultaDetalle.css";
import PageHeader from "../components/PageHeader";
import Swal from "sweetalert2";
import { Stethoscope } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

function toDatetimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toApiDatetime(value) {
  if (!value) return null;
  return value.replace("T", " ") + ":00";
}

export default function ConsultaDetalle() {
  const { consultaId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [consulta, setConsulta] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(searchParams.get("edit") === "1");
  const [saveMessage, setSaveMessage] = useState("");

  const [form, setForm] = useState({
    doctor_id: "",
    pet_id: "",
    client_id: "",
    fecha: "",
    motivo: "",
    diagnostico: "",
    observaciones: "",
    estado: "",
    gravedad: "",
    proxima_cita: "",
    motivo_seguimiento: "",
  });

  const [initialForm, setInitialForm] = useState(null);

  const hasChanges = useMemo(() => {
    if (!initialForm) return false;
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  }, [form, initialForm]);

  const formatDate = (date) => {
    if (!date) return "—";

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSaveMessage("");
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const loadConsulta = async () => {
      try {
        setError("");
        setSaveMessage("");

        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const res = await fetch(`${API_URL}/api/consultas/${consultaId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const raw = await res.text();

        let data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          throw new Error(`Server did not return valid JSON. Status: ${res.status}`);
        }

        if (!res.ok) {
          throw new Error(data.message || "No se pudo cargar la consulta.");
        }

        setConsulta(data);

        const nextForm = {
          doctor_id: data.doctor_id || "",
          pet_id: data.pet_id || "",
          client_id: data.client_id || "",
          fecha: toDatetimeLocal(data.visit_at),
          motivo: data.reason || "",
          diagnostico: data.diagnosis || "",
          observaciones: data.notes || "",
          estado: data.estado || "",
          gravedad: data.gravedad || "",
          proxima_cita: toDatetimeLocal(data.proxima_cita),
          motivo_seguimiento: data.motivo_seguimiento || "",
        };

        setForm(nextForm);
        setInitialForm(nextForm);
      } catch (err) {
        setError(err.message || "Error cargando consulta.");
      }
    };

    loadConsulta();
  }, [consultaId, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (editMode && hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [editMode, hasChanges]);

  const confirmDiscard = async (text) => {
    const result = await Swal.fire({
      title: "Cambios sin guardar",
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Seguir editando",
      confirmButtonColor: "#e76f51",
      cancelButtonColor: "#0f6e84",
      reverseButtons: true,
    });
    return result.isConfirmed;
  };

  const handleCancelEdit = async () => {
    if (hasChanges) {
      const confirmed = await confirmDiscard(
        "Tienes cambios sin guardar. ¿Seguro que quieres cancelar?"
      );
      if (!confirmed) return;
    }

    setForm(initialForm || form);
    setSaveMessage("");
    setEditMode(false);
  };

  const handleBack = async () => {
    if (editMode && hasChanges) {
      const confirmed = await confirmDiscard(
        "Tienes cambios sin guardar. ¿Seguro que quieres salir?"
      );
      if (!confirmed) return;
    }

    navigate(-1);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSaveMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const payload = {
        doctor_id: form.doctor_id || null,
        pet_id: form.pet_id || null,
        client_id: form.client_id || null,
        fecha: toApiDatetime(form.fecha),
        motivo: form.motivo || null,
        diagnostico: form.diagnostico || null,
        observaciones: form.observaciones || null,
        estado: form.estado || null,
        gravedad: form.gravedad || null,
        proxima_cita: toApiDatetime(form.proxima_cita),
        motivo_seguimiento: form.motivo_seguimiento || null,
      };

      const res = await fetch(`${API_URL}/api/consultas/${consultaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "No se pudo actualizar la consulta.");
      }

      const updatedConsulta = {
        ...consulta,
        doctor_id: form.doctor_id,
        pet_id: form.pet_id,
        client_id: form.client_id,
        visit_at: payload.fecha,
        reason: form.motivo,
        diagnosis: form.diagnostico,
        notes: form.observaciones,
        estado: form.estado,
        gravedad: form.gravedad,
        proxima_cita: payload.proxima_cita,
        motivo_seguimiento: form.motivo_seguimiento,
      };

      setConsulta(updatedConsulta);
      setInitialForm({ ...form });
      setEditMode(false);
      setSaveMessage(data.message || "Consulta actualizada correctamente.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Error actualizando consulta.");
    } finally {
      setSaving(false);
    }
  };

  if (error && !consulta) {
    return (
      <div className="cd-page">
        <div className="cd-container">
          <div className="cd-error">{error}</div>
        </div>
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="cd-page">
        <div className="cd-container">
          <div className="cd-loading">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <div className="cd-container">
        <PageHeader
          icon={<Stethoscope size={24} />}
          title={editMode ? "Editar consulta" : consulta.reason || "Consulta"}
          subtitle={consulta.doctor || "Sin doctor"}
          onBack={handleBack}
          backClassName="btn-back--s80"
          variant="bare"
        />

        {saveMessage ? <div className="cd-success">{saveMessage}</div> : null}
        {error ? <div className="cd-error">{error}</div> : null}

        <div className="cd-card">
          <div className="cd-card-head">
            <h3 className="cd-card-title">Información</h3>

            {!editMode ? (
              <button
                type="button"
                className="cd-btn-secondary"
                onClick={() => {
                  setSaveMessage("");
                  setEditMode(true);
                }}
              >
                Editar
              </button>
            ) : (
              <div className="cd-edit-badge">Modo edición</div>
            )}
          </div>

          {!editMode ? (
            <div className="cd-info-grid">
              <div className="cd-info-row">
                <span>Doctor</span>
                <strong>{consulta.doctor || "Sin doctor"}</strong>
              </div>

              <div className="cd-info-row">
                <span>Fecha</span>
                <strong>{formatDate(consulta.visit_at)}</strong>
              </div>

              <div className="cd-info-row">
                <span>Estado</span>
                <strong
                  className={`cd-info-pill ${
                    consulta.estado === "abierta" ? "cd-info-pill--open" : ""
                  }`}
                >
                  {consulta.estado || "Sin estado"}
                </strong>
              </div>

              <div className="cd-info-row">
                <span>Gravedad</span>
                <strong
                  className={`cd-info-pill ${
                    consulta.gravedad === "moderada" ? "cd-info-pill--moderate" : ""
                  }`}
                >
                  {consulta.gravedad || "Sin gravedad"}
                </strong>
              </div>

              <div className="cd-info-row">
                <span>Próxima cita</span>
                <strong>{formatDate(consulta.proxima_cita)}</strong>
              </div>

              <div className="cd-info-row">
                <span>Motivo de seguimiento</span>
                <strong>{consulta.motivo_seguimiento || "—"}</strong>
              </div>
            </div>
          ) : (
            <>
              <div className="cd-form-grid">
                <div className="cd-field">
                  <label>Fecha y hora</label>
                  <input
                    type="datetime-local"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                  />
                </div>

                <div className="cd-field">
                  <label>Motivo</label>
                  <input
                    type="text"
                    name="motivo"
                    value={form.motivo}
                    onChange={handleChange}
                  />
                </div>

                <div className="cd-field">
                  <label>Diagnóstico</label>
                  <textarea
                    name="diagnostico"
                    value={form.diagnostico}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className="cd-field">
                  <label>Observaciones</label>
                  <textarea
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className="cd-field">
                  <label>Estado</label>
                  <input
                    type="text"
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                  />
                </div>

                <div className="cd-field">
                  <label>Gravedad</label>
                  <input
                    type="text"
                    name="gravedad"
                    value={form.gravedad}
                    onChange={handleChange}
                  />
                </div>

                <div className="cd-field">
                  <label>Próxima cita</label>
                  <input
                    type="datetime-local"
                    name="proxima_cita"
                    value={form.proxima_cita}
                    onChange={handleChange}
                  />
                </div>

                <div className="cd-field">
                  <label>Motivo de seguimiento</label>
                  <input
                    type="text"
                    name="motivo_seguimiento"
                    value={form.motivo_seguimiento}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="cd-sticky-actions">
                <div className="cd-unsaved">
                  {hasChanges ? "Tienes cambios sin guardar" : "Sin cambios"}
                </div>

                <div className="cd-actions-right">
                  <button
                    type="button"
                    className="cd-btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="cd-btn-primary"
                    onClick={handleSave}
                    disabled={saving || !hasChanges}
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {!editMode && consulta.diagnosis && (
          <div className="cd-card">
            <h3 className="cd-card-title">Diagnóstico</h3>
            <p className="cd-text">{consulta.diagnosis}</p>
          </div>
        )}

        {!editMode && consulta.treatment && (
          <div className="cd-card">
            <h3 className="cd-card-title">Tratamiento</h3>
            <p className="cd-text">{consulta.treatment}</p>
          </div>
        )}

        {!editMode && consulta.notes && (
          <div className="cd-card">
            <h3 className="cd-card-title">Notas</h3>
            <p className="cd-text">{consulta.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
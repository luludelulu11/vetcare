import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { getMisMascotas, crearCita } from "../../services/portalService.js";

const SERVICIOS = ["Consulta", "Vacunación", "Grooming"];
const PRIORIDADES = [
  { value: "NORMAL", label: "Normal" },
  { value: "URGENTE", label: "Urgente" },
];

// Placeholder offering until the backend exposes real availability
// (GET /api/portal/disponibilidad?fecha=YYYY-MM-DD).
const SLOTS = ["09:00", "09:45", "10:30", "11:15", "14:00", "14:45", "15:30", "16:15"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AgendarCita() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mascotas, setMascotas] = useState([]);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");

  const [mascotaId, setMascotaId] = useState(searchParams.get("mascota") || "");
  const [servicio, setServicio] = useState("");
  const [prioridad, setPrioridad] = useState("NORMAL");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    getMisMascotas()
      .then((data) => {
        if (!alive) return;
        setMascotas(data);
        if (data.length === 1) setMascotaId(String(data[0].id));
        setStatus("ready");
      })
      .catch((e) => {
        if (!alive) return;
        setLoadError(e.message);
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mascotaId) return setFormError("Selecciona una mascota.");
    if (!servicio) return setFormError("Selecciona un servicio.");
    if (!fecha) return setFormError("Selecciona una fecha.");
    if (fecha < todayISO()) return setFormError("La fecha no puede ser en el pasado.");
    if (!hora) return setFormError("Selecciona un horario.");

    setFormError("");

    try {
      setSaving(true);
      await crearCita({ mascotaId, servicio, prioridad, fecha, hora, motivo: motivo.trim() });

      await Swal.fire({
        icon: "success",
        title: "Solicitud enviada",
        text: "La clínica revisará tu solicitud y confirmará la cita.",
        timer: 2600,
        showConfirmButton: false,
      });

      navigate("/mis-citas", { replace: true });
    } catch (err) {
      setFormError(err.message || "No se pudo enviar la solicitud.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="portal__greeting">Agendar cita</h1>
      <p className="portal__subtitle">
        Elige servicio y horario; la clínica confirmará tu solicitud.
      </p>

      {status === "loading" && <div className="portal-card">Cargando…</div>}
      {status === "error" && <div className="portal-error">{loadError}</div>}

      {status === "ready" && mascotas.length === 0 && (
        <div className="portal-card portal-state">
          <p className="portal-state__title">Aún no hay mascotas</p>
          <p>Necesitas una mascota registrada para agendar una cita.</p>
        </div>
      )}

      {status === "ready" && mascotas.length > 0 && (
        <form className="cita-form" onSubmit={handleSubmit}>
          <p className="cita-label">Mascota</p>
          <div className="chip-row">
            {mascotas.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip-option ${String(p.id) === String(mascotaId) ? "chip-option--active" : ""}`}
                onClick={() => setMascotaId(String(p.id))}
              >
                {p.nombre}
              </button>
            ))}
          </div>

          <p className="cita-label">Servicio</p>
          <div className="chip-row">
            {SERVICIOS.map((s) => (
              <button
                key={s}
                type="button"
                className={`chip-option ${servicio === s ? "chip-option--active" : ""}`}
                onClick={() => setServicio(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <p className="cita-label">Prioridad</p>
          <div className="chip-row">
            {PRIORIDADES.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`chip-option ${prioridad === p.value ? "chip-option--active" : ""} ${
                  p.value === "URGENTE" ? "chip-option--danger" : ""
                }`}
                onClick={() => setPrioridad(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>

          <p className="cita-label">Fecha</p>
          <input
            type="date"
            className="cita-date"
            min={todayISO()}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />

          <p className="cita-label">Horario</p>
          <div className="slot-grid">
            {SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                className={`slot ${hora === s ? "slot--active" : ""}`}
                onClick={() => setHora(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <p className="cita-label">Motivo (opcional)</p>
          <textarea
            className="cita-textarea"
            rows={3}
            placeholder="Cuéntanos brevemente el motivo de la visita"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          {formError && <div className="portal-error">{formError}</div>}

          <button type="submit" className="btn-primary-teal" disabled={saving}>
            {saving ? "Enviando..." : "Solicitar cita"}
          </button>

          <p className="cita-note">
            Tu cita quedará pendiente hasta que la clínica la confirme.
          </p>
        </form>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Plus } from "lucide-react";
import Swal from "sweetalert2";
import { getMisCitas, cancelarCita } from "../../services/portalService.js";
import { formatFecha } from "../../utils/vacunaStatus.js";
import { formatRD } from "../../utils/money.js";

const ESTADOS = {
  PENDIENTE: { label: "Pendiente", tone: "warning" },
  CONFIRMADA: { label: "Confirmada", tone: "ok" },
  CANCELADA: { label: "Cancelada", tone: "neutral" },
  COMPLETADA: { label: "Completada", tone: "neutral" },
};

function esCancelable(cita) {
  if (!["PENDIENTE", "CONFIRMADA"].includes(cita.estado)) return false;
  const hoy = new Date().toISOString().slice(0, 10);
  return !cita.fecha || cita.fecha >= hoy;
}

export default function MisCitas() {
  const [citas, setCitas] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getMisCitas()
      .then((data) => {
        if (!alive) return;
        const sorted = [...data].sort((a, b) =>
          `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`)
        );
        setCitas(sorted);
        setStatus("ready");
      })
      .catch((e) => {
        if (!alive) return;
        setError(e.message);
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleCancelar = async (cita) => {
    const result = await Swal.fire({
      title: "Cancelar cita",
      text: `¿Seguro que quieres cancelar la cita de ${cita.mascotaNombre || "tu mascota"}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
      confirmButtonColor: "#e76f51",
      cancelButtonColor: "#0f6e84",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    try {
      await cancelarCita(cita.id);
      setCitas((prev) =>
        prev.map((c) => (c.id === cita.id ? { ...c, estado: "CANCELADA" } : c))
      );
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo cancelar la cita.",
      });
    }
  };

  return (
    <>
      <h1 className="portal__greeting">Mis citas</h1>
      <p className="portal__subtitle">Solicitudes y citas de tus mascotas.</p>

      <Link to="/agendar-cita" className="btn-primary-teal cita-cta">
        <Plus size={16} /> Agendar cita
      </Link>

      {status === "loading" && <div className="portal-card">Cargando…</div>}
      {status === "error" && <div className="portal-error">{error}</div>}

      {status === "ready" && citas.length === 0 && (
        <div className="portal-card portal-state">
          <CalendarDays size={28} />
          <p className="portal-state__title">Sin citas todavía</p>
          <p>Agenda tu primera cita con el botón de arriba.</p>
        </div>
      )}

      {status === "ready" &&
        citas.map((cita) => {
          const estado = ESTADOS[cita.estado] || ESTADOS.PENDIENTE;
          return (
            <div className="portal-card" key={cita.id}>
              <div className="cita-row">
                <div className="cita-info">
                  <p className="cita-title">
                    {cita.mascotaNombre || "Mascota"} · {cita.servicio}
                  </p>
                  <p className="cita-meta">
                    {formatFecha(cita.fecha)}
                    {cita.hora ? ` · ${cita.hora}` : ""}
                    {cita.prioridad === "URGENTE" ? " · Urgente" : ""}
                  </p>
                  {cita.motivo && <p className="cita-meta">{cita.motivo}</p>}
                  {cita.precioEstimado != null && (
                    <p className="cita-meta">{formatRD(cita.precioEstimado)}</p>
                  )}
                </div>

                <div className="cita-side">
                  <span className={`badge badge--${estado.tone}`}>{estado.label}</span>
                  {cita.mascotaAgresiva && (
                    <span className="badge badge--danger">Agresiva</span>
                  )}
                  {esCancelable(cita) && (
                    <button
                      type="button"
                      className="cita-cancel"
                      onClick={() => handleCancelar(cita)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
    </>
  );
}

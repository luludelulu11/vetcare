import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PawPrint, Syringe, CalendarDays, ChevronRight } from "lucide-react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { getMisMascotas, getMiMascota } from "../../services/portalService.js";
import { vacunaStatus, formatFecha } from "../../utils/vacunaStatus.js";

export default function Inicio() {
  const { user } = useAuth();
  const [mascotas, setMascotas] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const pets = await getMisMascotas();
        if (!alive) return;
        setMascotas(pets);

        // Pull each pet's carnet to surface the nearest upcoming/overdue booster.
        const details = await Promise.all(
          pets.map((p) => getMiMascota(p.id).catch(() => null))
        );
        if (!alive) return;

        const soon = [];
        details.forEach((d) => {
          if (!d?.carnet) return;
          d.carnet.forEach((v) => {
            const st = vacunaStatus(v.fecha_refuerzo);
            if (st.key === "proxima" || st.key === "vencida") {
              soon.push({ pet: d.nombre, vacuna: v.vacuna, fecha: v.fecha_refuerzo, st });
            }
          });
        });
        soon.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        setUpcoming(soon.slice(0, 4));
        setStatus("ready");
      } catch (e) {
        if (!alive) return;
        setError(e.message);
        setStatus("error");
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const nombre = user?.first_name || user?.nombre || user?.username || "";

  return (
    <>
      <h1 className="portal__greeting">Hola{nombre ? `, ${nombre}` : ""} 👋</h1>
      <p className="portal__subtitle">Bienvenido a tu portal de VetCare.</p>

      {status === "error" && <div className="portal-error">{error}</div>}

      {status !== "error" && (
        <div className="portal-hero">
          <p>Tus mascotas</p>
          <h2>{status === "loading" ? "—" : mascotas.length}</h2>
        </div>
      )}

      <h2 className="portal__section-title">Refuerzos por atender</h2>

      {status === "loading" && (
        <div className="portal-card">Cargando…</div>
      )}

      {status === "ready" && upcoming.length === 0 && (
        <div className="portal-card portal-state">
          <Syringe size={28} />
          <p className="portal-state__title">Todo al día</p>
          <p>No hay refuerzos próximos ni vencidos.</p>
        </div>
      )}

      {status === "ready" &&
        upcoming.map((u, i) => (
          <div className="portal-card" key={i}>
            <div className="carnet-item" style={{ padding: 0, border: "none" }}>
              <div>
                <p className="carnet-name">{u.vacuna}</p>
                <p className="carnet-detail">
                  {u.pet} · refuerzo {formatFecha(u.fecha)}
                </p>
              </div>
              <span className={`badge badge--${u.st.tone}`}>{u.st.label}</span>
            </div>
          </div>
        ))}

      <h2 className="portal__section-title">Acceso rápido</h2>
      <Link to="/agendar-cita" className="pet-link">
        <div className="portal-card pet-row">
          <span className="pet-avatar">
            <CalendarDays size={22} />
          </span>
          <div className="pet-info">
            <p className="pet-name">Agendar cita</p>
            <p className="pet-meta">Consulta, vacunación o grooming</p>
          </div>
          <ChevronRight className="pet-chevron" size={20} />
        </div>
      </Link>
      <Link to="/mis-mascotas" className="pet-link">
        <div className="portal-card pet-row">
          <span className="pet-avatar">
            <PawPrint size={22} />
          </span>
          <div className="pet-info">
            <p className="pet-name">Mis mascotas</p>
            <p className="pet-meta">Ver perfiles y carnet de vacunación</p>
          </div>
          <ChevronRight className="pet-chevron" size={20} />
        </div>
      </Link>
    </>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PawPrint, ChevronRight, Plus } from "lucide-react";
import { getMisMascotas } from "../../services/portalService.js";

function petMeta(p) {
  const parts = [];
  if (p.especie) parts.push(p.especie);
  if (p.raza) parts.push(p.raza);
  if (p.edad) parts.push(`${p.edad} ${Number(p.edad) === 1 ? "año" : "años"}`);
  return parts.join(" · ");
}

export default function MisMascotas() {
  const [mascotas, setMascotas] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getMisMascotas()
      .then((data) => {
        if (!alive) return;
        setMascotas(data);
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

  return (
    <>
      <h1 className="portal__greeting">Mis mascotas</h1>
      <p className="portal__subtitle">Toca una mascota para ver su carnet.</p>

      <Link to="/agregar-mascota" className="btn-primary-teal cita-cta">
        <Plus size={16} /> Agregar mascota
      </Link>

      {status === "loading" && <div className="portal-card">Cargando…</div>}
      {status === "error" && <div className="portal-error">{error}</div>}

      {status === "ready" && mascotas.length === 0 && (
        <div className="portal-card portal-state">
          <PawPrint size={28} />
          <p className="portal-state__title">Aún no hay mascotas</p>
          <p>Registra tu primera mascota con el botón de arriba.</p>
        </div>
      )}

      {status === "ready" &&
        mascotas.map((p) => (
          <Link key={p.id} to={`/mis-mascotas/${p.id}`} className="pet-link">
            <div className="portal-card pet-row">
              <span className="pet-avatar">
                <PawPrint size={22} />
              </span>
              <div className="pet-info">
                <p className="pet-name">{p.nombre}</p>
                <p className="pet-meta">{petMeta(p) || "Sin datos"}</p>
              </div>
              <ChevronRight className="pet-chevron" size={20} />
            </div>
          </Link>
        ))}
    </>
  );
}

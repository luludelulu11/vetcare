import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Syringe, CreditCard, FileText, ChevronRight } from "lucide-react";
import { getMiMascota } from "../../services/portalService.js";
import { vacunaStatus, formatFecha } from "../../utils/vacunaStatus.js";

function petMeta(p) {
  const parts = [];
  if (p.especie) parts.push(p.especie);
  if (p.raza) parts.push(p.raza);
  if (p.sexo) parts.push(p.sexo === "FEMALE" ? "Hembra" : p.sexo === "MALE" ? "Macho" : p.sexo);
  if (p.edad) parts.push(`${p.edad} ${Number(p.edad) === 1 ? "año" : "años"}`);
  if (p.peso) parts.push(`${p.peso} kg`);
  return parts.join(" · ");
}

function carnetDetail(v) {
  const parts = [];
  if (v.fecha_aplicacion) parts.push(`Aplicada: ${formatFecha(v.fecha_aplicacion)}`);
  else if (v.fecha_consulta) parts.push(`Registrada: ${formatFecha(v.fecha_consulta)}`);
  if (v.fecha_refuerzo) parts.push(`Refuerzo: ${formatFecha(v.fecha_refuerzo)}`);
  if (v.lote) parts.push(`Lote: ${v.lote}`);
  if (v.laboratorio) parts.push(`Lab: ${v.laboratorio}`);
  if (v.veterinario) parts.push(`Vet: ${v.veterinario}`);
  if (v.lote_observaciones) parts.push(v.lote_observaciones);
  return parts;
}

export default function MascotaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getMiMascota(id)
      .then((data) => {
        if (!alive) return;
        setPet(data);
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
  }, [id]);

  return (
    <>
      <button className="portal-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Volver
      </button>

      {status === "loading" && <div className="portal-card">Cargando…</div>}
      {status === "error" && <div className="portal-error">{error}</div>}

      {status === "ready" && pet && (
        <>
          <h1 className="portal__greeting">{pet.nombre}</h1>
          <p className="portal__subtitle">{petMeta(pet) || "Sin datos"}</p>

          {pet.observaciones && (
            <div className="portal-card">
              <p className="carnet-detail">{pet.observaciones}</p>
            </div>
          )}

          <h2 className="portal__section-title">Carnet de vacunación</h2>

          <Link to={`/mis-mascotas/${id}/carnet`} className="pet-link">
            <div className="portal-card pet-row">
              <span className="pet-avatar">
                <CreditCard size={22} />
              </span>
              <div className="pet-info">
                <p className="pet-name">Ver carnet completo</p>
                <p className="pet-meta">Tarjeta de vacunación · descargar / imprimir</p>
              </div>
              <ChevronRight className="pet-chevron" size={20} />
            </div>
          </Link>

          <Link to={`/mis-mascotas/${id}/historial`} className="pet-link">
            <div className="portal-card pet-row">
              <span className="pet-avatar">
                <FileText size={22} />
              </span>
              <div className="pet-info">
                <p className="pet-name">Historial clínico</p>
                <p className="pet-meta">Consultas y datos · descargar / imprimir</p>
              </div>
              <ChevronRight className="pet-chevron" size={20} />
            </div>
          </Link>

          {(!pet.carnet || pet.carnet.length === 0) && (
            <div className="portal-card portal-state">
              <Syringe size={28} />
              <p className="portal-state__title">Sin vacunas registradas</p>
              <p>Las vacunas aplicadas en consulta aparecerán aquí.</p>
            </div>
          )}

          {pet.carnet && pet.carnet.length > 0 && (
            <div className="portal-card">
              {pet.carnet.map((v, i) => {
                const st = vacunaStatus(v.fecha_refuerzo);
                return (
                  <div className="carnet-item" key={i}>
                    <div>
                      <p className="carnet-name">{v.vacuna}</p>
                      {carnetDetail(v).map((line, j) => (
                        <p className="carnet-detail" key={j}>
                          {line}
                        </p>
                      ))}
                    </div>
                    <span className={`badge badge--${st.tone}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

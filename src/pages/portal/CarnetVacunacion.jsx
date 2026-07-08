import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Syringe, PawPrint } from "lucide-react";
import { getMiMascota } from "../../services/portalService.js";
import { vacunaStatus, formatFecha } from "../../utils/vacunaStatus.js";
import "./carnet.css";

function petMeta(p) {
  const parts = [];
  if (p.especie) parts.push(p.especie);
  if (p.raza) parts.push(p.raza);
  if (p.sexo)
    parts.push(p.sexo === "FEMALE" ? "Hembra" : p.sexo === "MALE" ? "Macho" : p.sexo);
  if (p.edad) parts.push(`${p.edad} ${Number(p.edad) === 1 ? "año" : "años"}`);
  return parts.join(" · ");
}

// Overall card status from the worst individual dose status.
function overallStatus(carnet = []) {
  const keys = carnet.map((v) => vacunaStatus(v.fecha_refuerzo).key);
  if (keys.includes("vencida"))
    return { label: "Tiene vacunas vencidas", tone: "danger" };
  if (keys.includes("proxima"))
    return { label: "Refuerzos próximos", tone: "warning" };
  if (keys.length > 0) return { label: "Al día", tone: "ok" };
  return { label: "Sin registros", tone: "neutral" };
}

export default function CarnetVacunacion() {
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

  const overall = useMemo(() => overallStatus(pet?.carnet), [pet]);
  const emitido = formatFecha(new Date().toISOString().slice(0, 10));

  return (
    <>
      <button className="portal-back no-print" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Volver
      </button>

      {status === "loading" && <div className="portal-card">Cargando…</div>}
      {status === "error" && <div className="portal-error">{error}</div>}

      {status === "ready" && pet && (
        <>
          <section className="vcard" id="carnet-printable">
            <header className="vcard__band">
              <div className="vcard__brand">
                <Syringe size={18} />
                <span>VetCare</span>
              </div>
              <h1 className="vcard__title">Carnet de Vacunación</h1>
            </header>

            <div className="vcard__identity">
              <span className="vcard__avatar">
                <PawPrint size={26} />
              </span>
              <div className="vcard__id-text">
                <h2>{pet.nombre}</h2>
                <p>{petMeta(pet) || "Sin datos"}</p>
              </div>
              <span className={`badge badge--${overall.tone} vcard__overall`}>
                {overall.label}
              </span>
            </div>

            {(!pet.carnet || pet.carnet.length === 0) && (
              <div className="vcard__empty">
                <Syringe size={26} />
                <p>Aún no hay vacunas registradas para esta mascota.</p>
              </div>
            )}

            {pet.carnet && pet.carnet.length > 0 && (
              <div className="vcard__table">
                <div className="vcard__thead">
                  <span>Vacuna</span>
                  <span>Aplicada</span>
                  <span>Refuerzo</span>
                  <span>Estado</span>
                </div>

                {pet.carnet.map((v, i) => {
                  const st = vacunaStatus(v.fecha_refuerzo);
                  const extra = [
                    v.lote && `Lote ${v.lote}`,
                    v.laboratorio,
                    v.veterinario && `Vet. ${v.veterinario}`,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <div className="vcard__row" key={i}>
                      <span className="vcard__vac">
                        <strong>{v.vacuna}</strong>
                        {extra && <em>{extra}</em>}
                      </span>
                      <span data-label="Aplicada">
                        {formatFecha(v.fecha_aplicacion || v.fecha_consulta) || "—"}
                      </span>
                      <span data-label="Refuerzo">
                        {formatFecha(v.fecha_refuerzo) || "—"}
                      </span>
                      <span data-label="Estado">
                        <span className={`badge badge--${st.tone}`}>{st.label}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <footer className="vcard__footer">
              <span>Emitido el {emitido}</span>
              <span>
                Documento informativo generado desde el portal de VetCare.
              </span>
            </footer>
          </section>

          <button
            className="vcard__download no-print"
            onClick={() => window.print()}
          >
            <Download size={17} /> Descargar / Imprimir carnet
          </button>
        </>
      )}
    </>
  );
}

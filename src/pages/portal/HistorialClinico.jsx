import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import {
  getMiMascota,
  getMiMascotaConsultas,
  getMiPerfil,
} from "../../services/portalService.js";
import HistorialClinicoDoc from "../../components/HistorialClinicoDoc.jsx";
import "./carnet.css";

function mapSexo(s) {
  if (s === "FEMALE") return "Hembra";
  if (s === "MALE") return "Macho";
  return s || "";
}

function normalizeConsultas(list = []) {
  return list.map((c) => ({
    fecha: c.visit_at || c.fecha,
    doctor: c.doctor,
    tipos: (c.tipos_consulta_detalle || [])
      .map((t) => t.nombre || t.codigo)
      .filter(Boolean)
      .join(", "),
    motivo: c.reason || c.motivo,
    diagnostico: c.diagnosis || c.diagnostico,
    observaciones: c.notes || c.observaciones,
    vitals: {
      peso: c.peso,
      temp: c.temperatura,
      fc: c.frecuencia_cardiaca,
      fr: c.frecuencia_respiratoria,
      pa: c.presion_arterial,
      sat: c.saturacion_oxigeno,
    },
    medicaciones: c.medicaciones,
    analisis: c.analisis,
    vacunas: c.vacunas,
  }));
}

export default function HistorialClinico() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pet, setPet] = useState(null);
  const [owner, setOwner] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [petData, consultasData, perfil] = await Promise.all([
          getMiMascota(id),
          getMiMascotaConsultas(id),
          getMiPerfil().catch(() => null),
        ]);
        if (!alive) return;
        setPet({
          nombre: petData.nombre,
          especie: petData.especie,
          raza: petData.raza,
          sexo: mapSexo(petData.sexo),
          edad: petData.edad,
          peso: petData.peso,
          observaciones: petData.observaciones,
        });
        setOwner(
          perfil
            ? {
                nombre: [perfil.first_name, perfil.last_name]
                  .filter(Boolean)
                  .join(" "),
                telefono: perfil.phone_primary,
                email: perfil.email,
              }
            : null
        );
        setConsultas(normalizeConsultas(consultasData));
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
  }, [id]);

  return (
    <>
      <button className="portal-back no-print" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Volver
      </button>

      {status === "loading" && <div className="portal-card">Cargando…</div>}
      {status === "error" && <div className="portal-error">{error}</div>}

      {status === "ready" && (
        <>
          <HistorialClinicoDoc pet={pet} owner={owner} consultas={consultas} />
          <button
            className="vcard__download no-print"
            onClick={() => window.print()}
          >
            <Download size={17} /> Descargar / Imprimir historial
          </button>
        </>
      )}
    </>
  );
}

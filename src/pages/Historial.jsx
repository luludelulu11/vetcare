import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./historial.css";
import { isDemoMode } from "../utils/demoMode";
import { demoMascotas } from "../mock/demoData";

const API_URL = "http://localhost:5000";

export default function HistorialClinico() {
  const navigate = useNavigate();

  const [mascotasResumen, setMascotasResumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadResumen = async () => {

      if (isDemoMode) {
  const resumen = demoMascotas.map((pet, index) => {
    const mascotaId = pet.id ?? `pet-${index}`;

    return {
      mascotaId,
      nombre: pet.name ?? pet.nombre ?? "Sin nombre",
      raza: pet.breed ?? pet.raza ?? "Sin raza",
      edad: pet.age_years ?? pet.edad ?? "Sin edad",
      clienteNombre:
        `${pet.first_name ?? ""} ${pet.last_name ?? ""}`.trim() ||
        pet.clienteNombre ||
        "Sin tutor/a",
      consultasTotal: pet.consultasTotal ?? 2,
      ultimaConsulta: pet.ultimaConsulta ?? "2026-04-13",
    };
  });

  setMascotasResumen(resumen);
  setLoading(false);
  return;
}
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

        

        const mascotasRes = await fetch(`${API_URL}/api/mascotas`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (mascotasRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const mascotasRaw = await mascotasRes.text();

        let mascotasData = [];
        try {
          mascotasData = mascotasRaw ? JSON.parse(mascotasRaw) : [];
        } catch {
          throw new Error("JSON inválido al cargar mascotas.");
        }

        if (!mascotasRes.ok) {
          throw new Error(
            mascotasData?.message || "No se pudieron cargar las mascotas."
          );
        }

        if (!Array.isArray(mascotasData)) {
          throw new Error("La respuesta de mascotas no es un arreglo.");
        }

        const resumenPromises = mascotasData.map(async (pet, index) => {
          const mascotaId =
            pet.id ??
            pet.Id ??
            pet.ID ??
            pet.mascotaId ??
            pet.MascotaId ??
            pet._id ??
            `pet-${index}`;

          let consultas = [];

          try {
            const consultasRes = await fetch(
              `${API_URL}/api/mascotas/${mascotaId}/consultas`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (consultasRes.status === 401) {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate("/", { replace: true });
              return {
                mascotaId,
                nombre: pet.name ?? pet.nombre ?? "Sin nombre",
                raza: pet.breed ?? pet.raza ?? "Sin raza",
                edad: pet.age_years ?? pet.edad ?? "Sin edad",
                clienteNombre:
                  `${pet.first_name ?? ""} ${pet.last_name ?? ""}`.trim() ||
                  "Sin tutor/a",
                consultasTotal: 0,
                ultimaConsulta: "",
              };
            }

            const consultasRaw = await consultasRes.text();

            try {
              consultas = consultasRaw ? JSON.parse(consultasRaw) : [];
            } catch {
              consultas = [];
            }

            if (!consultasRes.ok || !Array.isArray(consultas)) {
              consultas = [];
            }
          } catch {
            consultas = [];
          }

          const ultimaConsulta =
            consultas.length > 0
              ? consultas[0].visit_at ||
                consultas[0].fecha ||
                consultas[0].created_at ||
                ""
              : "";

          return {
            mascotaId,
            nombre: pet.name ?? pet.nombre ?? "Sin nombre",
            raza: pet.breed ?? pet.raza ?? "Sin raza",
            edad: pet.age_years ?? pet.edad ?? "Sin edad",
            clienteNombre:
              `${pet.first_name ?? ""} ${pet.last_name ?? ""}`.trim() ||
              "Sin tutor/a",
            consultasTotal: consultas.length,
            ultimaConsulta,
          };
        });

        const resumen = await Promise.all(resumenPromises);
        setMascotasResumen(resumen);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar el historial clínico.");
      } finally {
        setLoading(false);
      }
    };

    loadResumen();
  }, [navigate]);

  const filteredMascotas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return mascotasResumen;

    return mascotasResumen.filter((pet) => {
      return (
        String(pet.nombre).toLowerCase().includes(term) ||
        String(pet.raza).toLowerCase().includes(term) ||
        String(pet.edad).toLowerCase().includes(term) ||
        String(pet.clienteNombre).toLowerCase().includes(term)
      );
    });
  }, [mascotasResumen, search]);

  const totalConsultas = useMemo(() => {
    return mascotasResumen.reduce(
      (acc, item) => acc + (item.consultasTotal || 0),
      0
    );
  }, [mascotasResumen]);

  const conConsultas = useMemo(
    () => filteredMascotas.filter((pet) => pet.consultasTotal > 0),
    [filteredMascotas]
  );

  const sinConsultas = useMemo(
    () => filteredMascotas.filter((pet) => pet.consultasTotal === 0),
    [filteredMascotas]
  );

  const formatDate = (date) => {
    if (!date) return "Sin fecha";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const avatarClassByIndex = (index) => {
    const variants = [
      "hc-pet-avatar--mint",
      "hc-pet-avatar--blue",
      "hc-pet-avatar--purple",
      "hc-pet-avatar--orange",
      "hc-pet-avatar--gold",
    ];
    return variants[index % variants.length];
  };

  const renderRow = (pet, index, muted = false) => (
    <button
      type="button"
      key={pet.mascotaId}
      className={`hc-pet-row ${muted ? "hc-pet-row--muted" : ""}`}
      onClick={() => navigate(`/historial-clinico/${pet.mascotaId}`)}
    >
      <div className="hc-pet-left">
        <div className={`hc-pet-avatar ${avatarClassByIndex(index)}`}>
          {getInitials(pet.nombre)}
        </div>

        <div className="hc-pet-main">
          <h2>{pet.nombre}</h2>
          <p>
            {pet.raza || "Sin raza"} · {pet.edad || "Sin edad"} ·{" "}
            {pet.clienteNombre || "Sin dueño"}
          </p>
        </div>
      </div>

      <div className="hc-pet-right">
        <span className={`hc-pill ${muted ? "hc-pill--muted" : ""}`}>
          {pet.consultasTotal > 0
            ? `${pet.consultasTotal} consulta${pet.consultasTotal !== 1 ? "s" : ""}`
            : "sin consultas"}
        </span>

        <span className="hc-last-date">
          {pet.consultasTotal > 0 ? formatDate(pet.ultimaConsulta) : ""}
        </span>

        <span className="hc-chevron">›</span>
      </div>
    </button>
  );

  return (
    <div className="hc-page">
      <div className="hc-container">
        <header className="hc-hero">
          <button
            type="button"
            className="hc-hero-back"
            onClick={() => navigate("/menu")}
          >
            <span className="hc-hero-back-arrow">←</span>
            <span>volver</span>
          </button>

          <div className="hc-hero-copy">
            <h1>Historial clínico</h1>
            <p>Expedientes por paciente</p>
          </div>

          <div className="hc-hero-stats">
            <strong>{totalConsultas}</strong>
            <span>consultas totales</span>
          </div>
        </header>

        <div className="hc-toolbar">
          <div className="hc-search-wrap">
            <span className="hc-search-icon">⌕</span>
            <input
              type="text"
              className="hc-search"
              placeholder="Buscar paciente, dueño, raza..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="hc-results">
            {filteredMascotas.length} paciente
            {filteredMascotas.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="hc-state-card">Cargando historial clínico...</div>
        ) : error ? (
          <div className="hc-state-card hc-state-card--error">{error}</div>
        ) : filteredMascotas.length === 0 ? (
          <div className="hc-state-card">No se encontraron pacientes.</div>
        ) : (
          <>
            {conConsultas.length > 0 && (
              <section className="hc-section">
                <h3 className="hc-section-title">Con visitas recientes</h3>
                <div className="hc-list">
                  {conConsultas.map((pet, index) => renderRow(pet, index))}
                </div>
              </section>
            )}

            {sinConsultas.length > 0 && (
              <section className="hc-section">
                <h3 className="hc-section-title">Sin consultas</h3>
                <div className="hc-list">
                  {sinConsultas.map((pet, index) =>
                    renderRow(pet, index + conConsultas.length, true)
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
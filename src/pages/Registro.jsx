import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Registro.css";
import Select from "react-select";
import { isDemoMode } from "../utils/demoMode";
import { demoRegistro } from "../mock/demoData";

const API_URL = "http://localhost:5000";



 export default function Registro() {

  const navigate = useNavigate();
  const options = [
  { value: "todos", label: "Todos" },
  { value: "activo", label: "Activos" },
  { value: "inactivo", label: "Inactivos" },
];
  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const formatCedula = (value = "") => {
    const digits = String(value).replace(/\D/g, "").slice(0, 11);

    if (!digits) return "Sin cédula";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}-${digits.slice(10)}`;
  };

  const formatPhone = (value = "") => {
    const digits = String(value).replace(/\D/g, "").slice(0, 10);

    if (!digits) return "Sin teléfono";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };


 

  useEffect(() => {
    const loadData = async () => {
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

        const estadoQuery =
          estadoFiltro === "todos" ? "" : `?estado=${estadoFiltro}`;

           if (isDemoMode) {
          setClientes(demoRegistro.clientes);
          setMascotas(demoRegistro.mascotas);
          setLoading(false);
          return;
        }

        const [clientesResponse, mascotasResponse] = await Promise.all([
          fetch(`${API_URL}/api/clientes${estadoQuery}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/api/mascotas${estadoQuery}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const clientesRaw = await clientesResponse.text();
        const mascotasRaw = await mascotasResponse.text();

        let clientesData = [];
        let mascotasData = [];

        try {
          clientesData = clientesRaw ? JSON.parse(clientesRaw) : [];
        } catch {
          throw new Error("JSON inválido al cargar usuarios.");
        }

        try {
          mascotasData = mascotasRaw ? JSON.parse(mascotasRaw) : [];
        } catch {
          throw new Error("JSON inválido al cargar mascotas.");
        }

        if (clientesResponse.status === 401 || mascotasResponse.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        if (!clientesResponse.ok) {
          throw new Error(
            clientesData?.message || "No se pudieron cargar los usuarios."
          );
        }

        if (!mascotasResponse.ok) {
          throw new Error(
            mascotasData?.message || "No se pudieron cargar las mascotas."
          );
        }

        const normalizedClientes = Array.isArray(clientesData)
          ? clientesData.map((cliente) => ({
              id:
                cliente.id ??
                cliente.Id ??
                cliente.ID ??
                cliente.clienteId ??
                cliente.ClienteId ??
                cliente._id ??
                "",
              nombre:
                cliente.nombre ??
                cliente.Nombre ??
                cliente.nombreCompleto ??
                cliente.NombreCompleto ??
                "",
              cedula:
                cliente.cedula ??
                cliente.Cedula ??
                cliente.cedulaCliente ??
                "",
              direccion:
                cliente.direccion ??
                cliente.Direccion ??
                "",
              correo:
                cliente.correo ??
                cliente.Correo ??
                cliente.email ??
                cliente.Email ??
                "",
              telefono:
                cliente.telefono ??
                cliente.Telefono ??
                cliente.tel ??
                "",
              telefono2:
                cliente.telefono2 ??
                cliente.Telefono2 ??
                cliente.tel2 ??
                "",
              estado:
                cliente.estado ??
                cliente.Estado ??
                "activo",
            }))
          : [];

        const normalizedMascotas = Array.isArray(mascotasData)
          ? mascotasData.map((mascota) => ({
              id:
                mascota.id ??
                mascota.Id ??
                mascota.ID ??
                mascota.mascotaId ??
                mascota.MascotaId ??
                mascota._id ??
                "",
              clienteId:
                mascota.clienteId ??
                mascota.ClienteId ??
                mascota.client_id ??
                mascota.cliente_id ??
                mascota.idCliente ??
                mascota.IdCliente ??
                mascota.ownerId ??
                "",
              nombre:
                mascota.nombre ??
                mascota.Nombre ??
                mascota.name ??
                mascota.Name ??
                "",
              edad:
                mascota.edad ??
                mascota.Edad ??
                mascota.age_years ??
                mascota.age ??
                "",
              raza:
                mascota.raza ??
                mascota.Raza ??
                mascota.breed ??
                mascota.Breed ??
                "",
              sexo:
                mascota.sexo ??
                mascota.Sexo ??
                mascota.sex ??
                mascota.Sex ??
                "",
              peso:
                mascota.peso ??
                mascota.Peso ??
                mascota.weight_kg ??
                mascota.weight ??
                "",
              observaciones:
                mascota.observaciones ??
                mascota.Observaciones ??
                mascota.notes ??
                mascota.Notes ??
                "",
              estado:
                mascota.estado ??
                mascota.Estado ??
                "activo",
            }))
          : [];

        setClientes(normalizedClientes);
        setMascotas(normalizedMascotas);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar el registro.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, estadoFiltro]);

  const mascotasAgrupadas = useMemo(() => {
    const mapa = {};

    for (const mascota of mascotas) {
      const key = String(mascota.clienteId ?? "");
      if (!mapa[key]) mapa[key] = [];
      mapa[key].push(mascota);
    }

    return mapa;
  }, [mascotas]);

  const clientesConResumen = useMemo(() => {
    return clientes.map((cliente) => {
      const mascotasCliente = mascotasAgrupadas[String(cliente.id)] || [];

      return {
        ...cliente,
        mascotas: mascotasCliente,
        mascotasTotal: mascotasCliente.length,
        ultimaMascota:
          mascotasCliente.length > 0 ? mascotasCliente[0].nombre || "Mascota" : "",
      };
    });
  }, [clientes, mascotasAgrupadas]);

  const clientesFiltrados = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return clientesConResumen;

    const normalizedTerm = term.replace(/\D/g, "");

    return clientesConResumen.filter((cliente) => {
      const clienteMatch =
        String(cliente.nombre ?? "").toLowerCase().includes(term) ||
        String(cliente.cedula ?? "").toLowerCase().includes(term) ||
        String(cliente.direccion ?? "").toLowerCase().includes(term) ||
        String(cliente.correo ?? "").toLowerCase().includes(term) ||
        String(cliente.telefono ?? "").toLowerCase().includes(term) ||
        String(cliente.telefono2 ?? "").toLowerCase().includes(term) ||
        (normalizedTerm &&
          (String(cliente.cedula ?? "").replace(/\D/g, "").includes(normalizedTerm) ||
            String(cliente.telefono ?? "").replace(/\D/g, "").includes(normalizedTerm) ||
            String(cliente.telefono2 ?? "").replace(/\D/g, "").includes(normalizedTerm)));

      const mascotaMatch = cliente.mascotas.some((mascota) => {
        return (
          String(mascota.nombre ?? "").toLowerCase().includes(term) ||
          String(mascota.edad ?? "").toLowerCase().includes(term) ||
          String(mascota.raza ?? "").toLowerCase().includes(term) ||
          String(mascota.sexo ?? "").toLowerCase().includes(term) ||
          String(mascota.peso ?? "").toLowerCase().includes(term) ||
          String(mascota.observaciones ?? "").toLowerCase().includes(term) ||
          String(mascota.estado ?? "").toLowerCase().includes(term)
        );
      });

      return clienteMatch || mascotaMatch;
    });
  }, [clientesConResumen, search]);

  const totalMascotas = useMemo(() => {
    return mascotas.length;
  }, [mascotas]);

  const conMascotas = useMemo(
    () => clientesFiltrados.filter((cliente) => cliente.mascotasTotal > 0),
    [clientesFiltrados]
  );

  const sinMascotas = useMemo(
    () => clientesFiltrados.filter((cliente) => cliente.mascotasTotal === 0),
    [clientesFiltrados]
  );

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
      "rg-avatar--mint",
      "rg-avatar--blue",
      "rg-avatar--purple",
      "rg-avatar--orange",
      "rg-avatar--gold",
    ];
    return variants[index % variants.length];
  };

  const renderEstadoBadge = (estado) => (
    <span
      style={{
        background: estado === "activo" ? "#d1fae5" : "#fee2e2",
        color: estado === "activo" ? "#065f46" : "#991b1b",
        padding: "4px 8px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 700,
      }}
    >
      {estado === "activo" ? "Activo" : "Inactivo"}
    </span>
  );

  const renderRow = (cliente, index, muted = false) => (
    <button
      type="button"
      key={cliente.id}
      className={`rg-row ${muted ? "rg-row--muted" : ""}`}
      onClick={() => navigate(`/registro/${cliente.id}`)}
    >
      <div className="rg-row-left">
        <div className={`rg-avatar ${avatarClassByIndex(index)}`}>
          {getInitials(cliente.nombre)}
        </div>

        <div className="rg-row-main">
          <h2>{cliente.nombre || "Cliente sin nombre"}</h2>
          <p>
            <strong>Ced.</strong> {formatCedula(cliente.cedula)} ·{" "}
            <strong>Tel.</strong>{" "}
            {cliente.telefono
              ? formatPhone(cliente.telefono)
              : cliente.telefono2
              ? formatPhone(cliente.telefono2)
              : "Sin teléfono"}{" "}
            ·{" "}
            {cliente.mascotasTotal > 0
              ? `${cliente.mascotasTotal} mascota${cliente.mascotasTotal !== 1 ? "s" : ""}`
              : "sin mascotas"}
          </p>

          <div style={{ marginTop: "6px" }}>
            {renderEstadoBadge(cliente.estado)}
          </div>
        </div>
      </div>

      <div className="rg-row-right">
        <span className={`rg-pill ${muted ? "rg-pill--muted" : ""}`}>
          {cliente.mascotasTotal > 0
            ? `${cliente.mascotasTotal} mascota${cliente.mascotasTotal !== 1 ? "s" : ""}`
            : "sin mascotas"}
        </span>

        <span className="rg-last-text">
          {cliente.mascotasTotal > 0 ? cliente.ultimaMascota : ""}
        </span>

        <span className="rg-chevron">›</span>
      </div>
    </button>
  );

  return (
    <div className="rg-page">
      <div className="rg-container">
        <header className="rg-hero">
          <button
            type="button"
            className="rg-hero-back"
            onClick={() => navigate("/menu")}
          >
            <span className="rg-hero-back-arrow">←</span>
            <span>volver</span>
          </button>

          <div className="rg-hero-copy">
            <h1>Registro</h1>
            <p>Usuarios y mascotas registradas</p>
          </div>

          <div className="rg-hero-stats">
            <strong>{totalMascotas}</strong>
            <span>Mascotas en total</span>
          </div>
        </header>

        <div className="rg-toolbar">
          <div className="rg-search-wrap">
            <span className="rg-search-icon">⌕</span>
            <input
              type="text"
              className="rg-search"
              placeholder="Buscar usuario, mascota, teléfono, ID, raza..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rg-filter-select-wrap">
        <Select
  value={options.find((opt) => opt.value === estadoFiltro)}
  onChange={(selected) => setEstadoFiltro(selected.value)}
  options={options}
  isSearchable={false}
  styles={{
    control: (base, state) => ({
      ...base,
      borderRadius: "16px",
      borderColor: state.isFocused ? "#4f8d98" : "#d8e5e7",
      boxShadow: state.isFocused
        ? "0 0 0 4px rgba(79,141,152,0.15)"
        : "0 8px 20px rgba(18,52,59,0.06)",
      padding: "4px",
      fontWeight: 700,
      cursor: "pointer",
      height: "50px",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "14px",
      overflow: "hidden",
      boxShadow: "0 14px 30px rgba(0,0,0,0.12)",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#0f766e"
        : state.isFocused
        ? "#e6f4f5"
        : "#fff",
      color: state.isSelected ? "#fff" : "#24424a",
      fontWeight: 600,
      cursor: "pointer",
    }),
  }}
/>

          
        </div>

          <div className="rg-results">
            {clientesFiltrados.length} usuario
            {clientesFiltrados.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="rg-state-card">Cargando registros...</div>
        ) : error ? (
          <div className="rg-state-card rg-state-card--error">{error}</div>
        ) : clientes.length === 0 ? (
          <div className="rg-state-card">No hay usuarios registrados.</div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="rg-state-card">
            No hay coincidencias. Intenta con otro término.
          </div>
        ) : (
          <>
            {conMascotas.length > 0 && (
              <section className="rg-section">
                <h3 className="rg-section-title">Con mascotas registradas</h3>
                <div className="rg-list">
                  {conMascotas.map((cliente, index) => renderRow(cliente, index))}
                </div>
              </section>
            )}

            {sinMascotas.length > 0 && (
              <section className="rg-section">
                <h3 className="rg-section-title">Sin mascotas</h3>
                <div className="rg-list">
                  {sinMascotas.map((cliente, index) =>
                    renderRow(cliente, index + conMascotas.length, true)
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

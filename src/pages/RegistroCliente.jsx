import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./RegistroCliente.css";
import PageHeader from "../components/PageHeader";
import { IdCard } from "lucide-react";


const API_URL = import.meta.env.VITE_API_URL || "";

export default function RegistroCliente() {
  const navigate = useNavigate();
  const { clienteId } = useParams();

  const [clienteInfo, setClienteInfo] = useState(null);
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
const [saving, setSaving] = useState(false);
const [clienteForm, setClienteForm] = useState({
  nombre: "",
  cedula: "",
  direccion: "",
  correo: "",
  telefono: "",
  telefono2: "",
});

  const formatCedula = (value = "") => {
    const digits = String(value).replace(/\D/g, "").slice(0, 11);

    if (!digits) return "—";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    if (digits.length <= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}-${digits.slice(10)}`;
  };

  const formatPhone = (value = "") => {
    const digits = String(value).replace(/\D/g, "").slice(0, 10);

    if (!digits) return "—";
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  useEffect(() => {
    const cargarRegistroCliente = async () => {

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

            

        const [clienteRes, mascotasRes] = await Promise.all([
          fetch(`${API_URL}/api/clientes?id=${clienteId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/api/mascotas?clienteId=${clienteId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        if (clienteRes.status === 401 || mascotasRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const clienteRaw = await clienteRes.text();
        const mascotasRaw = await mascotasRes.text();

        let clienteData = [];
        let mascotasData = [];

        try {
          clienteData = clienteRaw ? JSON.parse(clienteRaw) : [];
        } catch {
          throw new Error("JSON inválido al cargar usuario.");
        }

        try {
          mascotasData = mascotasRaw ? JSON.parse(mascotasRaw) : [];
        } catch {
          throw new Error("JSON inválido al cargar mascotas.");
        }

        if (!clienteRes.ok) {
          throw new Error(clienteData?.message || "No se pudo cargar el usuario.");
        }

        if (!mascotasRes.ok) {
          throw new Error(
            mascotasData?.message || "No se pudieron cargar las mascotas."
          );
        }

        if (!Array.isArray(clienteData) || clienteData.length === 0) {
          throw new Error("Usuario no encontrado.");
        }

        const cliente = clienteData[0];

        const normalizedCliente = {
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
            "Sin nombre",
          cedula:
            cliente.cedula ??
            cliente.Cedula ??
            cliente.cedulaCliente ??
            "",
          direccion:
            cliente.direccion ??
            cliente.Direccion ??
            "No registrado",
          correo:
            cliente.correo ??
            cliente.Correo ??
            cliente.email ??
            cliente.Email ??
            "No registrado",
          telefono:
            cliente.telefono ??
            cliente.Telefono ??
            cliente.tel ??
            "",
          telefono2:
            cliente.telefono2 ??
            cliente.Telefono2 ??
            cliente.tel2 ??
            "—",
          estado:
            cliente.estado ??
            cliente.Estado ??
            "activo",
        };

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
              nombre:
                mascota.nombre ??
                mascota.Nombre ??
                mascota.name ??
                mascota.Name ??
                "Sin nombre",
              raza:
                mascota.raza ??
                mascota.Raza ??
                mascota.breed ??
                mascota.Breed ??
                "Sin raza",
              edad:
                mascota.edad ??
                mascota.Edad ??
                mascota.age_years ??
                mascota.age ??
                "Sin edad",
              sexo:
                mascota.sexo ??
                mascota.Sexo ??
                mascota.sex ??
                mascota.Sex ??
                "No registrado",
              peso:
                mascota.peso ??
                mascota.Peso ??
                mascota.weight_kg ??
                mascota.weight ??
                "No registrado",
              observaciones:
                mascota.observaciones ??
                mascota.Observaciones ??
                mascota.notes ??
                mascota.Notes ??
                "Sin observaciones",
              estado:
                mascota.estado ??
                mascota.Estado ??
                "activo",
            }))
          : [];

        setClienteInfo(normalizedCliente);
setClienteForm({
  nombre: normalizedCliente.nombre || "",
  cedula: normalizedCliente.cedula || "",
  direccion: normalizedCliente.direccion || "",
  correo: normalizedCliente.correo || "",
  telefono: normalizedCliente.telefono || "",
  telefono2: normalizedCliente.telefono2 || "",
});
setMascotas(normalizedMascotas);
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudo cargar el registro del usuario.");
      } finally {
        setLoading(false);
      }
    };

    if (clienteId) {
      cargarRegistroCliente();
    }
  }, [clienteId, navigate]);

  const totalMascotas = useMemo(() => mascotas.length, [mascotas]);

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
      "rcc-pet-avatar--mint",
      "rcc-pet-avatar--blue",
      "rcc-pet-avatar--purple",
      "rcc-pet-avatar--orange",
      "rcc-pet-avatar--gold",
    ];
    return variants[index % variants.length];
  };
  const handleClienteChange = (e) => {
  const { name, value } = e.target;
  setClienteForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const handleSaveCliente = async () => {
  try {
    setSaving(true);

    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/", { replace: true });
      return;
    }

    const res = await fetch(`${API_URL}/api/clientes/${clienteInfo.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(clienteForm),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "No se pudo actualizar el usuario.");
    }

    setClienteInfo((prev) =>
      prev
        ? {
            ...prev,
            nombre: clienteForm.nombre,
            cedula: clienteForm.cedula,
            direccion: clienteForm.direccion,
            correo: clienteForm.correo,
            telefono: clienteForm.telefono,
            telefono2: clienteForm.telefono2,
          }
        : prev
    );

    alert(data.message || "Usuario actualizado correctamente.");
    setEditMode(false);
  } catch (err) {
    alert(err.message || "Error actualizando usuario.");
  } finally {
    setSaving(false);
  }
};

  const handleToggleCliente = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const res = await fetch(
        `${API_URL}/api/clientes/${clienteInfo.id}/toggle`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Error cambiando estado");
      }

      window.location.reload();
    } catch (err) {
      alert(err.message || "Error cambiando estado");
    }
  };

  const renderMascotaRow = (mascota, index) => (
    <div
        key={mascota.id}
        className="rcc-pet-row"
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/historial-clinico/${mascota.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            navigate(`/historial-clinico/${mascota.id}`);
          }
        }}
      >
      <div className="rcc-pet-left">
        <div className={`rcc-pet-avatar ${avatarClassByIndex(index)}`}>
          {getInitials(mascota.nombre)}
        </div>

        <div className="rcc-pet-main">
          <h2>{mascota.nombre}</h2>
          <p>
            {mascota.raza || "Sin raza"} · {mascota.edad || "Sin edad"} ·{" "}
            {mascota.sexo || "Sin sexo"}
          </p>

          <span
            style={{
              background:
                mascota.estado === "activo" ? "#d1fae5" : "#fee2e2",
              color:
                mascota.estado === "activo" ? "#065f46" : "#991b1b",
              padding: "4px 8px",
              borderRadius: "6px",
              fontSize: "12px",
              marginTop: "6px",
              display: "inline-block",
              fontWeight: 600,
            }}
          >
            {mascota.estado === "activo" ? "Activa" : "Inactiva"}
          </span>
        </div>
      </div>
      

      <div className="rcc-pet-right">
        <span className="rcc-pill">{mascota.peso || "Sin peso"}</span>
        <span className="rcc-pill rcc-pill--soft">
          {mascota.observaciones || "Sin observaciones"}
        </span>
        <button
  type="button"
  onClick={async (e) => {
    e.stopPropagation();

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/mascotas/${mascota.id}/toggle`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error cambiando estado");
      }

      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  }}
  className={`pet-status-btn ${
    mascota.estado === "activo"
      ? "pet-status-btn--danger"
      : "pet-status-btn--success"
  }`}
>
  {mascota.estado === "activo" ? "Desactivar" : "Activar"}
</button>
            <span className="chev-btn">›</span>
          </div>
        </div>
      );

  return (
    <div className="rcc-page">
      <div className="rcc-container">
        <PageHeader
          icon={<IdCard size={24} />}
          title="Registro de usuario"
          subtitle="Detalle del usuario y sus mascotas"
          onBack={() => navigate("/registro")}
          backClassName="btn-back--s75"
         
        />

        {loading ? (
          <div className="rcc-state-card">Cargando registro del usuario...</div>
        ) : error ? (
          <div className="rcc-state-card rcc-state-card--error">{error}</div>
        ) : (
          <>
            <section className="rcc-summary-grid">
              <article className="rcc-card">
                <h2>USUARIO</h2>

                <div style={{ marginBottom: "10px" }}>
                  <button
                    type="button"
                    onClick={handleToggleCliente}
                    className="rc-toggle-btn"
                    >
                    Cambiar estado (Activo / Inactivo)
                  </button>
                </div>

                <div style={{ marginBottom: "12px" }}>
  {!editMode ? (
          <button
        type="button"
        onClick={() => setEditMode(true)}
        className="rc-edit-btn"
      >
        Editar datos
      </button>
  ) : (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => setEditMode(false)}
        disabled={saving}
        style={{
          background: "#d1d5db",
          color: "#111827",
          border: "none",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Cancelar
      </button>

      <button
        type="button"
        onClick={handleSaveCliente}
        disabled={saving}
        style={{
          background: "#0f766e",
          color: "#fff",
          border: "none",
          padding: "8px 12px",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  )}
</div>

{!editMode ? (
  <div className="rcc-client-main">
    <div className="rcc-client-avatar">
      {getInitials(clienteInfo?.nombre || "")}
    </div>

    <div className="rcc-client-main-copy">
      <strong>{clienteInfo?.nombre}</strong>
      <span>{clienteInfo?.cedula}</span>

      <span
        style={{
          background:
            clienteInfo?.estado === "activo" ? "#d1fae5" : "#fee2e2",
          color:
            clienteInfo?.estado === "activo" ? "#065f46" : "#991b1b",
          padding: "4px 8px",
          borderRadius: "6px",
          fontSize: "12px",
          marginTop: "4px",
          display: "inline-block",
          fontWeight: 600,
          width: "fit-content",
        }}
      >
        {clienteInfo?.estado === "activo" ? "Activo" : "Inactivo"}
      </span>
    </div>
  </div>
) : (
  <div
    style={{
      display: "grid",
      gap: "10px",
    }}
  >
    <input
      type="text"
      name="nombre"
      placeholder="Nombre"
      value={clienteForm.nombre}
      onChange={handleClienteChange}
      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
    />

    <input
      type="text"
      name="cedula"
      placeholder="Cédula"
      value={clienteForm.cedula}
      onChange={handleClienteChange}
      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
    />

    <input
      type="text"
      name="direccion"
      placeholder="Dirección"
      value={clienteForm.direccion}
      onChange={handleClienteChange}
      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
    />

    <input
      type="email"
      name="correo"
      placeholder="Correo"
      value={clienteForm.correo}
      onChange={handleClienteChange}
      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
    />

    <input
      type="text"
      name="telefono"
      placeholder="Teléfono"
      value={clienteForm.telefono}
      onChange={handleClienteChange}
      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
    />

    <input
      type="text"
      name="telefono2"
      placeholder="Teléfono secundario"
      value={clienteForm.telefono2}
      onChange={handleClienteChange}
      style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
    />
  </div>
)}
              </article>

              <article className="rcc-card">
  <h2>CONTACTO</h2>

  <div className="rcc-owner-lines">
    <div className="rcc-owner-line">
      <span>Email</span>
      <strong>{clienteInfo?.correo || "—"}</strong>
    </div>

    <div className="rcc-owner-line">
      <span>Teléfono</span>
      <strong>{clienteInfo?.telefono || "—"}</strong>
    </div>

    <div className="rcc-owner-line">
      <span>Dirección</span>
      <strong>{clienteInfo?.direccion || "—"}</strong>
    </div>
  </div>

  <div className="rcc-mini-stats">
    <div className="rcc-mini-stat">
      <strong>{totalMascotas}</strong>
      <span>mascotas</span>
    </div>

    <div className="rcc-mini-stat">
      <strong>{clienteInfo?.telefono2 || "—"}</strong>
      <span>tel. secundario</span>
    </div>
  </div>
</article>
            </section>

            <section className="rcc-detail-section">
              <div className="rcc-section-head">
                <h3>Mascotas asociadas</h3>
                <span className="rcc-count-pill">
                  {totalMascotas} mascota{totalMascotas !== 1 ? "s" : ""}
                </span>
              </div>

              {mascotas.length === 0 ? (
                <div className="rcc-state-card">
                  Este usuario no tiene mascotas registradas.
                </div>
              ) : (
                <div className="rcc-list">
                  {mascotas.map((mascota, index) =>
                    renderMascotaRow(mascota, index)
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

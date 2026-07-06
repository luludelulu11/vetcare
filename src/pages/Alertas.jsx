import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./alertas.module.css";
import { Bell, ExternalLink, Pencil, Mail, Trash2 } from "lucide-react";
import Swal from "sweetalert2";


const API_URL = import.meta.env.VITE_API_URL || "";


function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizeDateOnly(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function getAlertType(fecha) {
  if (!fecha) return "upcoming";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = normalizeDateOnly(fecha);
  if (!target) return "upcoming";

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  return "upcoming";
}

function getAlertLabel(type) {
  switch (type) {
    case "overdue":
      return "Atrasada";
    case "today":
      return "Hoy";
    case "tomorrow":
      return "Mañana";
    default:
      return "Próxima";
  }
}

const getAvatarColor = (text = "") => {
  const colors = [
    "#f6c5ca",
    "#c5e1f5",
    "#cbf3dc",
    "#FCF3CF",
    "#e9d3f4",
    "#FDEBD0",
    "#d4f8f5",
    "#d1eaf8",
  ];

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

function mapBackendCategoryToFrontend(category) {
  switch (category) {
    case "atrasadas":
      return "overdue";
    case "hoy":
      return "today";
    case "manana":
      return "tomorrow";
    case "proximas":
      return "upcoming";
    default:
      return "upcoming";
  }
}

export default function Alertas() {
  const navigate = useNavigate();

  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [stats, setStats] = useState({
    overdue: 0,
    today: 0,
    tomorrow: 0,
    upcoming: 0,
  });

  useEffect(() => {
    const loadAlertas = async () => {


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

      

        const response = await fetch(`${API_URL}/api/alertas`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const raw = await response.text();

        let data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          data = {};
        }

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        if (!response.ok) {
          setError(data?.message || "No se pudieron cargar las alertas.");
          setAlertas([]);
          return;
        }

        const resumen = data?.resumen || {};
        const lista = Array.isArray(data?.alertas) ? data.alertas : [];

        const normalized = lista.map((item, index) => {
  const fechaBase = item?.proxima_cita || item?.fecha || "";
  const frontendCategory = mapBackendCategoryToFrontend(item?.categoria);

          return {
            id: item?.id ?? `row-${index}`,
            consultaId: item?.consulta_id ?? item?.id ?? "",
            fecha: fechaBase,
            hora: formatTime(fechaBase),
            motivo:
              item?.motivo ??
              item?.motivo_seguimiento ??
              item?.diagnostico ??
              "",
            estado: item?.estado ?? "pendiente",
            patientId: item?.pet_id ?? "",
            patientName: item?.mascota_nombre ?? "Sin nombre",
            raza: item?.mascota_raza ?? "",
            ownerName: item?.cliente_nombre ?? "Sin dueño",
            phone: item?.cliente_telefono ?? "",
            doctorName: item?.doctor_nombre ?? "",
            categoria: frontendCategory,
            rawFechaConsulta: item?.fecha ?? "",
            rawProximaCita: item?.proxima_cita ?? "",
            gravedad: item?.gravedad ?? "",
            observaciones: item?.observaciones ?? "",
            diagnostico: item?.diagnostico ?? "",
          };
        });

        setAlertas(normalized);

        setStats({
          overdue: Number(resumen.atrasadas ?? 0),
          today: Number(resumen.hoy ?? 0),
          tomorrow: Number(resumen.manana ?? 0),
          upcoming: Number(resumen.proximas ?? 0),
        });
      } catch (err) {
        console.error("Error loading alertas:", err);
        setError("No se pudo conectar con el servidor.");
        setAlertas([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlertas();
  }, [navigate]);

  const handleEnviarCorreo = async (id) => {
  const token = localStorage.getItem("token");

  if (!token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/consultas/${id}/enviar-recordatorio`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/", { replace: true });
      return;
    }

    if (!response.ok) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data?.message || "Error enviando correo",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Correo enviado",
      text: data?.message || "Correo enviado correctamente",
      timer: 2500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Error enviando correo manual:", error);

    Swal.fire({
      icon: "error",
      title: "Error de conexión",
      text: "No se pudo enviar el correo",
      confirmButtonColor: "#dc2626",
    });
  }
};

  const handleDeleteAlerta = async (id) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const result = await Swal.fire({
      title: "¿Quitar alerta?",
      text: "La consulta no se borrará.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

      const response = await fetch(
        `${API_URL}/api/alertas/${id}/quitar`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "No se pudo eliminar la alerta.");
      }

      setAlertas((prev) =>
        prev.filter((item) => String(item.consultaId) !== String(id))
      );

      setStats((prev) => ({
        overdue: Math.max(
          0,
          prev.overdue -
            (alertas.find((a) => String(a.consultaId) === String(id))?.categoria ===
            "overdue"
              ? 1
              : 0)
        ),
        today: Math.max(
          0,
          prev.today -
            (alertas.find((a) => String(a.consultaId) === String(id))?.categoria ===
            "today"
              ? 1
              : 0)
        ),
        tomorrow: Math.max(
          0,
          prev.tomorrow -
            (alertas.find((a) => String(a.consultaId) === String(id))?.categoria ===
            "tomorrow"
              ? 1
              : 0)
        ),
        upcoming: Math.max(
          0,
          prev.upcoming -
            (alertas.find((a) => String(a.consultaId) === String(id))?.categoria ===
            "upcoming"
              ? 1
              : 0)
        ),
      }));

              Swal.fire({
          icon: "success",
          title: "Eliminada",
          text: data?.message || "Alerta eliminada correctamente",
          timer: 2000,
          showConfirmButton: false,
        });
    } catch (error) {
      console.error("Error deleting alerta:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Error eliminando la alerta.",
      });
    }
  };

  const filteredAlertas = useMemo(() => {
    let result = [...alertas];
    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter((item) => {
        return (
          String(item.patientName || "").toLowerCase().includes(q) ||
          String(item.ownerName || "").toLowerCase().includes(q) ||
          String(item.phone || "").toLowerCase().includes(q) ||
          String(item.doctorName || "").toLowerCase().includes(q) ||
          String(item.motivo || "").toLowerCase().includes(q) ||
          String(item.raza || "").toLowerCase().includes(q)
        );
      });
    }

    if (filter !== "all") {
      result = result.filter((item) => item.categoria === filter);
    }

    result.sort((a, b) => {
      const aDate = new Date(a.fecha || "");
      const bDate = new Date(b.fecha || "");

      const aTime = Number.isNaN(aDate.getTime()) ? 0 : aDate.getTime();
      const bTime = Number.isNaN(bDate.getTime()) ? 0 : bDate.getTime();

      return aTime - bTime;
    });

    return result;
  }, [alertas, search, filter]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button
              type="button"
              className={`btn-back btn-back--s90 ${styles.backBtn}`}
              onClick={() => navigate(-1)}
              aria-label="Volver"
            >
              ←
            </button>

            <span className={styles.iconChip} aria-hidden="true">
              <Bell size={24} />
            </span>

            <hgroup className={styles.heading}>
              <h1 className={styles.title}>Alertas</h1>
              <p className={styles.sub}>
                Próximas citas, seguimientos y pendientes clínicos
              </p>
            </hgroup>
          </div>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate("/consultas")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span>Nueva consulta</span>
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statOverdue}`}>
            <span className={styles.statLabel}>Atrasadas</span>
            <strong className={styles.statValue}>{stats.overdue}</strong>
          </div>

          <div className={`${styles.statCard} ${styles.statToday}`}>
            <span className={styles.statLabel}>Hoy</span>
            <strong className={styles.statValue}>{stats.today}</strong>
          </div>

          <div className={`${styles.statCard} ${styles.statTomorrow}`}>
            <span className={styles.statLabel}>Mañana</span>
            <strong className={styles.statValue}>{stats.tomorrow}</strong>
          </div>

          <div className={`${styles.statCard} ${styles.statUpcoming}`}>
            <span className={styles.statLabel}>Próximas</span>
            <strong className={styles.statValue}>{stats.upcoming}</strong>
          </div>
        </div>

        <div className={styles.toolbar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por mascota, dueño, doctor, teléfono o motivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className={styles.filterGroup}>
            <button
              type="button"
              className={`${styles.filterBtn} ${
                filter === "all" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("all")}
            >
              Todas
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${
                filter === "overdue" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("overdue")}
            >
              Atrasadas
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${
                filter === "today" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("today")}
            >
              Hoy
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${
                filter === "tomorrow" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("tomorrow")}
            >
              Mañana
            </button>
            <button
              type="button"
              className={`${styles.filterBtn} ${
                filter === "upcoming" ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter("upcoming")}
            >
              Próximas
            </button>
          </div>
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.emptyState}>Cargando alertas...</div>
          ) : error ? (
            <div className={styles.errorState}>{error}</div>
          ) : filteredAlertas.length === 0 ? (
            <div className={styles.emptyState}>No hay alertas para mostrar.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Alerta</th>
                    <th>Paciente</th>
                    <th>Tutor</th>
                    <th>Doctor</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Motivo</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlertas.map((item) => {
                    const type = item.categoria || getAlertType(item.fecha);
                    const bgColor = getAvatarColor(item.patientName || "");

                    return (
                      <tr key={item.id}>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              type === "overdue"
                                ? styles.badgeOverdue
                                : type === "today"
                                ? styles.badgeToday
                                : type === "tomorrow"
                                ? styles.badgeTomorrow
                                : styles.badgeUpcoming
                            }`}
                          >
                            {getAlertLabel(type)}
                          </span>
                        </td>

                        <td>
                          <div className={styles.patientCell}>
                            <div
                              className={styles.avatar}
                              style={{ backgroundColor: bgColor }}
                            >
                              {String(item.patientName || "?")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>

                            <div>
                              <div className={styles.patientName}>
                                {item.patientName || "Sin nombre"}
                              </div>
                              <div className={styles.patientSub}>
                                {item.raza || "Sin raza"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className={styles.ownerName}>
                            {item.ownerName || "Sin dueño"}
                          </div>
                          <div className={styles.ownerPhone}>
                            {item.phone || "—"}
                          </div>
                        </td>

                        <td>{item.doctorName || "—"}</td>
                        <td>{formatDate(item.fecha)}</td>
                        <td>{item.hora || "—"}</td>
                        <td className={styles.reasonCell}>{item.motivo || "—"}</td>

                        <td>
                        <div className={styles.actionGroup}>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnPrimary}`}
                            onClick={() => navigate(`/consulta/${item.consultaId}`)}
                            data-tip="Abrir consulta"
                            aria-label="Abrir consulta"
                          >
                            <ExternalLink size={17} />
                          </button>

                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => navigate(`/consulta/${item.consultaId}?edit=1`)}
                            data-tip="Editar consulta"
                            aria-label="Editar consulta"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleEnviarCorreo(item.consultaId)}
                            data-tip="Enviar correo al tutor"
                            aria-label="Enviar correo al tutor"
                          >
                            <Mail size={17} />
                          </button>

                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            onClick={() => handleDeleteAlerta(item.consultaId)}
                            data-tip="Borrar alerta"
                            aria-label="Borrar alerta"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td></tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
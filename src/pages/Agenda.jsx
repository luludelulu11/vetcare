import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  PawPrint,
  User,
  Check,
  X,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import Swal from "sweetalert2";
import styles from "./agenda.module.css";
import {
  getCitas,
  confirmarCita,
  cancelarCita,
  completarCita,
} from "../services/agendaService.js";

const ESTADOS = {
  PENDIENTE: { label: "Pendiente", tone: "warning" },
  CONFIRMADA: { label: "Confirmada", tone: "ok" },
  CANCELADA: { label: "Cancelada", tone: "danger" },
  COMPLETADA: { label: "Completada", tone: "neutral" },
};

const PRIORIDADES = {
  NORMAL: { label: "Normal", tone: "neutral" },
  ALTA: { label: "Alta", tone: "warning" },
  URGENTE: { label: "Urgente", tone: "danger" },
};

const FILTERS = [
  { key: "todas", label: "Todas" },
  { key: "pendientes", label: "Pendientes" },
  { key: "hoy", label: "Hoy" },
  { key: "confirmadas", label: "Confirmadas" },
];

function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function formatFecha(value) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("es-DO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default function Agenda() {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("pendientes");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setStatus("loading");
    try {
      const data = await getCitas();
      setCitas(Array.isArray(data) ? data : []);
      setStatus("ready");
    } catch (e) {
      if (e.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }
      setError(e.message);
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = todayISO();

  const stats = useMemo(() => {
    const active = citas.filter(
      (c) => c.estado !== "CANCELADA" && c.estado !== "COMPLETADA"
    );
    return {
      pendientes: citas.filter((c) => c.estado === "PENDIENTE").length,
      hoy: active.filter((c) => c.fecha === today).length,
      confirmadas: citas.filter((c) => c.estado === "CONFIRMADA").length,
      urgentes: active.filter((c) => c.prioridad === "URGENTE").length,
    };
  }, [citas, today]);

  const visible = useMemo(() => {
    let list = [...citas];
    if (filter === "pendientes") list = list.filter((c) => c.estado === "PENDIENTE");
    else if (filter === "confirmadas") list = list.filter((c) => c.estado === "CONFIRMADA");
    else if (filter === "hoy") list = list.filter((c) => c.fecha === today);
    return list.sort((a, b) =>
      `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`)
    );
  }, [citas, filter, today]);

  const runAction = async (cita, action, { title, confirmText, tone }) => {
    const result = await Swal.fire({
      title,
      text: `${cita.servicio} · ${cita.mascotaNombre || "Mascota"} — ${formatFecha(
        cita.fecha
      )} ${cita.hora || ""}`,
      icon: tone === "danger" ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: "Volver",
      confirmButtonColor: tone === "danger" ? "#d1584a" : "#0f6e84",
    });
    if (!result.isConfirmed) return;

    setBusyId(cita.id);
    try {
      await action(cita.id);
      await load();
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: e.message,
        icon: "error",
        confirmButtonColor: "#0f6e84",
      });
    } finally {
      setBusyId(null);
    }
  };

  const actionsFor = (cita) => {
    const disabled = busyId === cita.id;
    if (cita.estado === "PENDIENTE") {
      return (
        <>
          <button
            className={`${styles.action} ${styles.actionPrimary}`}
            disabled={disabled}
            onClick={() =>
              runAction(cita, confirmarCita, {
                title: "¿Confirmar esta cita?",
                confirmText: "Confirmar",
                tone: "ok",
              })
            }
          >
            <Check size={15} /> Confirmar
          </button>
          <button
            className={`${styles.action} ${styles.actionDanger}`}
            disabled={disabled}
            onClick={() =>
              runAction(cita, cancelarCita, {
                title: "¿Cancelar esta cita?",
                confirmText: "Cancelar cita",
                tone: "danger",
              })
            }
          >
            <X size={15} /> Rechazar
          </button>
        </>
      );
    }
    if (cita.estado === "CONFIRMADA") {
      return (
        <>
          <button
            className={`${styles.action} ${styles.actionPrimary}`}
            disabled={disabled}
            onClick={() =>
              runAction(cita, completarCita, {
                title: "¿Marcar como completada?",
                confirmText: "Completar",
                tone: "ok",
              })
            }
          >
            <CheckCheck size={15} /> Completar
          </button>
          <button
            className={`${styles.action} ${styles.actionDanger}`}
            disabled={disabled}
            onClick={() =>
              runAction(cita, cancelarCita, {
                title: "¿Cancelar esta cita?",
                confirmText: "Cancelar cita",
                tone: "danger",
              })
            }
          >
            <X size={15} /> Cancelar
          </button>
        </>
      );
    }
    return null;
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.iconChip}>
              <CalendarDays size={22} />
            </span>
            <div>
              <h1 className={styles.title}>Agenda</h1>
              <p className={styles.sub}>
                Solicitudes de citas y agenda confirmada de la clínica.
              </p>
            </div>
          </div>
          <button className={styles.refreshBtn} onClick={load}>
            <RefreshCw size={16} /> Actualizar
          </button>
        </header>

        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statPending}`}>
            <span className={styles.statValue}>{stats.pendientes}</span>
            <span className={styles.statLabel}>Pendientes</span>
          </div>
          <div className={`${styles.statCard} ${styles.statToday}`}>
            <span className={styles.statValue}>{stats.hoy}</span>
            <span className={styles.statLabel}>Hoy</span>
          </div>
          <div className={`${styles.statCard} ${styles.statConfirmed}`}>
            <span className={styles.statValue}>{stats.confirmadas}</span>
            <span className={styles.statLabel}>Confirmadas</span>
          </div>
          <div className={`${styles.statCard} ${styles.statUrgent}`}>
            <span className={styles.statValue}>{stats.urgentes}</span>
            <span className={styles.statLabel}>Urgentes</span>
          </div>
        </div>

        <div className={styles.filterGroup}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${
                filter === f.key ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {status === "loading" && (
          <div className={styles.stateCard}>Cargando agenda…</div>
        )}
        {status === "error" && (
          <div className={styles.errorState}>{error}</div>
        )}

        {status === "ready" && visible.length === 0 && (
          <div className={styles.stateCard}>
            <CalendarDays size={30} />
            <p className={styles.stateTitle}>No hay citas en esta vista</p>
            <p>Prueba otro filtro o actualiza la agenda.</p>
          </div>
        )}

        {status === "ready" &&
          visible.map((cita) => {
            const estado = ESTADOS[cita.estado] || ESTADOS.PENDIENTE;
            const prioridad = PRIORIDADES[cita.prioridad] || PRIORIDADES.NORMAL;
            return (
              <article key={cita.id} className={styles.citaCard}>
                <div className={styles.citaWhen}>
                  <span className={styles.citaDate}>{formatFecha(cita.fecha)}</span>
                  <span className={styles.citaTime}>
                    <Clock size={13} /> {cita.hora || "—"}
                  </span>
                </div>

                <div className={styles.citaBody}>
                  <div className={styles.citaTopline}>
                    <span className={styles.citaService}>{cita.servicio}</span>
                    <span className={`${styles.badge} ${styles[`badge_${prioridad.tone}`]}`}>
                      {prioridad.label}
                    </span>
                    <span className={`${styles.badge} ${styles[`badge_${estado.tone}`]}`}>
                      {estado.label}
                    </span>
                  </div>
                  <p className={styles.citaMeta}>
                    <PawPrint size={14} /> {cita.mascotaNombre || "—"}
                    <span className={styles.dot}>·</span>
                    <User size={14} /> {cita.clienteNombre || "—"}
                  </p>
                  {cita.motivo && (
                    <p className={styles.citaReason}>“{cita.motivo}”</p>
                  )}
                </div>

                <div className={styles.citaActions}>{actionsFor(cita)}</div>
              </article>
            );
          })}
      </div>
    </div>
  );
}

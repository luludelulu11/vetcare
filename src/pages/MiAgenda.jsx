import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock, PawPrint, User, CheckCheck, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import styles from "./agenda.module.css";
import { getMiAgenda, completarCita } from "../services/agendaService.js";
import { formatRD } from "../utils/money.js";

const PRIORIDADES = {
  NORMAL: { label: "Normal", tone: "neutral" },
  ALTA: { label: "Alta", tone: "warning" },
  URGENTE: { label: "Urgente", tone: "danger" },
};

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

export default function MiAgenda() {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("hoy");
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setStatus("loading");
    try {
      const data = await getMiAgenda();
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
    const pendientes = citas.filter((c) => c.estado === "CONFIRMADA");
    return {
      hoy: pendientes.filter((c) => c.fecha === today).length,
      proximas: pendientes.filter((c) => c.fecha > today).length,
      completadas: citas.filter((c) => c.estado === "COMPLETADA").length,
      urgentes: pendientes.filter((c) => c.prioridad === "URGENTE").length,
    };
  }, [citas, today]);

  const visible = useMemo(() => {
    let list = [...citas];
    if (filter === "hoy") list = list.filter((c) => c.fecha === today && c.estado === "CONFIRMADA");
    else if (filter === "proximas") list = list.filter((c) => c.fecha > today && c.estado === "CONFIRMADA");
    else if (filter === "completadas") list = list.filter((c) => c.estado === "COMPLETADA");
    return list.sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
  }, [citas, filter, today]);

  const completar = async (cita) => {
    const result = await Swal.fire({
      title: "¿Marcar como completada?",
      text: `${cita.servicio} · ${cita.mascotaNombre || "Mascota"} — ${formatFecha(cita.fecha)} ${cita.hora || ""}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Completar",
      cancelButtonText: "Volver",
      confirmButtonColor: "#0f6e84",
    });
    if (!result.isConfirmed) return;

    setBusyId(cita.id);
    try {
      await completarCita(cita.id);
      await load();
    } catch (e) {
      Swal.fire({ title: "Error", text: e.message, icon: "error", confirmButtonColor: "#0f6e84" });
    } finally {
      setBusyId(null);
    }
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
              <h1 className={styles.title}>Mi Agenda</h1>
              <p className={styles.sub}>Tus citas confirmadas y completadas.</p>
            </div>
          </div>
          <button className={styles.refreshBtn} onClick={load}>
            <RefreshCw size={16} /> Actualizar
          </button>
        </header>

        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statToday}`}>
            <span className={styles.statValue}>{stats.hoy}</span>
            <span className={styles.statLabel}>Hoy</span>
          </div>
          <div className={`${styles.statCard} ${styles.statConfirmed}`}>
            <span className={styles.statValue}>{stats.proximas}</span>
            <span className={styles.statLabel}>Próximas</span>
          </div>
          <div className={`${styles.statCard} ${styles.statPending}`}>
            <span className={styles.statValue}>{stats.completadas}</span>
            <span className={styles.statLabel}>Completadas</span>
          </div>
          <div className={`${styles.statCard} ${styles.statUrgent}`}>
            <span className={styles.statValue}>{stats.urgentes}</span>
            <span className={styles.statLabel}>Urgentes</span>
          </div>
        </div>

        <div className={styles.filterGroup}>
          {[
            { key: "hoy", label: "Hoy" },
            { key: "proximas", label: "Próximas" },
            { key: "completadas", label: "Completadas" },
            { key: "todas", label: "Todas" },
          ].map((f) => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterBtnActive : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {status === "loading" && <div className={styles.stateCard}>Cargando tu agenda…</div>}
        {status === "error" && <div className={styles.errorState}>{error}</div>}

        {status === "ready" && visible.length === 0 && (
          <div className={styles.stateCard}>
            <CalendarDays size={30} />
            <p className={styles.stateTitle}>No hay citas en esta vista</p>
            <p>Prueba otro filtro o actualiza la agenda.</p>
          </div>
        )}

        {status === "ready" &&
          visible.map((cita) => {
            const prioridad = PRIORIDADES[cita.prioridad] || PRIORIDADES.NORMAL;
            const disabled = busyId === cita.id;
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
                    <span
                      className={`${styles.badge} ${
                        cita.estado === "COMPLETADA" ? styles.badge_neutral : styles.badge_ok
                      }`}
                    >
                      {cita.estado === "COMPLETADA" ? "Completada" : "Confirmada"}
                    </span>
                    {cita.mascotaAgresiva && (
                      <span className={`${styles.badge} ${styles.badge_danger}`}>
                        Agresiva
                      </span>
                    )}
                  </div>
                  <p className={styles.citaMeta}>
                    <PawPrint size={14} /> {cita.mascotaNombre || "—"}
                    <span className={styles.dot}>·</span>
                    <User size={14} /> {cita.clienteNombre || "—"}
                    {cita.precioEstimado != null && (
                      <>
                        <span className={styles.dot}>·</span>
                        {formatRD(cita.precioEstimado)}
                      </>
                    )}
                  </p>
                  {cita.motivo && <p className={styles.citaReason}>“{cita.motivo}”</p>}
                </div>

                <div className={styles.citaActions}>
                  {cita.estado === "CONFIRMADA" && (
                    <button
                      className={`${styles.action} ${styles.actionPrimary}`}
                      disabled={disabled}
                      onClick={() => completar(cita)}
                    >
                      <CheckCheck size={15} /> Completar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
}

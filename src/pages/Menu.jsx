import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./menu.css";
import Swal from 'sweetalert2';
import { Moon, Sun } from "lucide-react";


const API_URL = import.meta.env.VITE_API_URL || "";

const baseMenuSections = [
  {
    label: "Registros",
    items: [
      {
        id: "registrar-clientes",
        path: "/clientes",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        ),
        label: "Registrar Usuarios",
      },
      {
        id: "registrar-mascotas",
        path: "/mascotas",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
            <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5" />
            <path d="M8 14v.5A3.5 3.5 0 0 0 11.5 18h1a3.5 3.5 0 0 0 3.5-3.5V14a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2z" />
            <path d="M6.5 10c-.223 1.685.8 3.032 2 3.5" />
            <path d="M17.5 10c.223 1.685-.8 3.032-2 3.5" />
          </svg>
        ),
        label: "Registrar Mascotas",
      },
      {
        id: "ver-registrados",
        path: "/Registro",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
        label: "Ver Mascotas y Usuarios",
      },

      {
        id: "registrar-usuarios",
        path: "/admin/register",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <circle cx="12" cy="11" r="3" />
        </svg>
                ),
        label: "Registrar usuarios internos",
      },
    ],
  },
  {
    label: "Consultas",
    items: [
      {
        id: "nueva-consulta",
        path: "/consultas",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        ),
        label: "Nueva Consulta",
      },
      {
        id: "historial",
        path: "/historial",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
        label: "Historiales clínicos",
      },
    ],
  },
  {
    label: "Notificaciones",
    items: [
      {
        id: "alertas",
        path: "/alertas",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
        label: "Alertas",
      },
    ],
  },
];

const baseQuickActions = [
  {
    id: "nueva-consulta",
    title: "Nueva Consulta",
    desc: "Inicia un nuevo registro medico para una mascota",
    path: "/consultas",
    featured: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    id: "registrar-clientes",
    title: "Registrar Usuario",
    path: "/clientes",
    desc: "Agrega un nuevo usuario al sistema",
    featured: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  {
    id: "registrar-mascotas",
    path: "/mascotas",
    title: "Registrar Mascota",
    desc: "Vincula una mascota a un usuario existente",
    featured: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
        <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5" />
        <path d="M8 14v.5A3.5 3.5 0 0 0 11.5 18h1a3.5 3.5 0 0 0 3.5-3.5V14a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2z" />
        <path d="M6.5 10c-.223 1.685.8 3.032 2 3.5" />
        <path d="M17.5 10c.223 1.685-.8 3.032-2 3.5" />
      </svg>
    ),
  },
  {
    id: "ver-registrados",
    title: "Mascotas y Usuarios",
    path: "/Registro",
    desc: "Consulta el listado general de usuarios y mascotas",
    featured: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "alertas",
    title: "Ver Alertas",
    path: "/alertas",
    desc: "",
    featured: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

export default function MenuPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("");

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const [counts, setCounts] = useState({
    clientes: 0,
    mascotas: 0,
    consultas: 0,
    alertas: 0,
  });

  const [stats, setStats] = useState([
    { label: "Clientes", value: "0", accent: "#2a9d8f" },
    { label: "Mascotas", value: "0", accent: "#e76f51" },
    { label: "Consultas", value: "0", accent: "#457b9d" },
    { label: "Alertas", value: "0", accent: "#8e44ad" },
  ]);

  const getStatIcon = (label) => {
    const key = String(label).toLowerCase();
    if (key.includes("cliente") || key.includes("usuario")) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    }
    if (key.includes("mascot")) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1" />
          <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1" />
        </svg>
      );
    }
    if (key.includes("consulta")) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    }
    if (key.includes("alert")) {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    }
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="4" />
      </svg>
    );
  };



  useEffect(() => {

    

    const fetchStats = async () => {
      
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          console.warn("No hay token guardado. Redirigiendo al login.");
          navigate("/", { replace: true });
          return;
        }

        
        const res = await fetch(`${API_URL}/api/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        if (!res.ok) {
          throw new Error(data?.message || "No se pudieron cargar las estadísticas");
        }

        const nextCounts = {
          clientes: Number(data.clientes ?? 0),
          mascotas: Number(data.mascotas ?? 0),
          consultas: Number(data.consultas ?? 0),
          alertas: Number(data.alertas ?? 0),
        };

        setCounts(nextCounts);

        setStats([
          {
            label: "Usuarios",
            value: String(nextCounts.clientes),
            accent: "#2a9d8f",
          },
          {
            label: "Mascotas",
            value: String(nextCounts.mascotas),
            accent: "#e76f51",
          },
          {
            label: "Consultas",
            value: String(nextCounts.consultas),
            accent: "#457b9d",
          },
          {
            label: "Alertas",
            value: String(nextCounts.alertas),
            accent: "#8e44ad",
          },
        ]);
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    fetchStats();
  }, [navigate]);

  const menuSections = useMemo(() => {
  return baseMenuSections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (item.id === "alertas") {
        return {
          ...item,
          badge: counts.alertas > 0 ? counts.alertas : undefined,
        };
      }

      return {
        ...item,
        badge: undefined,
      };
    }),
  }));
}, [counts]);

  const quickActions = useMemo(() => {
    return baseQuickActions.map((action) => {
      if (action.id === "alertas") {
        return {
          ...action,
          badge: counts.alertas > 0 ? counts.alertas : undefined,
          desc:
            counts.alertas > 0
              ? `${counts.alertas} alertas pendientes de revisión`
              : "No hay alertas pendientes",
        };
      }

      if (action.id === "registrar-clientes") {
        return {
          ...action,
          desc: `${counts.clientes} usuarios registrados`,
        };
      }

      if (action.id === "registrar-mascotas") {
        return {
          ...action,
          desc: `${counts.mascotas} mascotas registradas`,
        };
      }

      if (action.id === "ver-registrados") {
        return {
          ...action,
          desc: `${counts.clientes} clientes y ${counts.mascotas} mascotas registradas`,
        };
      }

      if (action.id === "nueva-consulta") {
        return {
          ...action,
          desc: `${counts.consultas} consultas registradas`,
        };
      }

      return action;
    });
  }, [counts]);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const capitalizedDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const handleNavClick = (id, path) => {
    setActiveItem(id);
    setSidebarOpen(false);

    if (path) {
      navigate(path);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="app">
      <div
        className={`overlay ${sidebarOpen ? "overlay--visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2a9d8f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
              <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5" />
              <path d="M8 14v.5A3.5 3.5 0 0 0 11.5 18h1a3.5 3.5 0 0 0 3.5-3.5V14a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2z" />
            </svg>
            <div className="sidebar__brand">
              Vet<span className="care">Care</span>
            </div>
          </div>

          <button
            className="sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="sidebar__nav">
          {menuSections.map((section) => (
            <div key={section.label} className="sidebar__section">
              <span className="sidebar__section-label">{section.label}</span>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  className={`sidebar__item ${activeItem === item.id ? "sidebar__item--active" : ""}`}
                  onClick={() => handleNavClick(item.id, item.path)}
                >
                  <span className="sidebar__item-icon">{item.icon}</span>
                  <span className="sidebar__item-label">{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="sidebar__badge">{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__logout" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <header className="topbar">
        <button
          className="topbar__menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="topbar__title">
          
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2a9d8f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
              <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5" />
              <path d="M8 14v.5A3.5 3.5 0 0 0 11.5 18h1a3.5 3.5 0 0 0 3.5-3.5V14a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2z" />
            </svg>
           
          <div className="sidebar__brand">
              Vet<span className="care">Care</span>
            </div>
        </div>

        <div className="topbar__right">
          <button
            className="topbar__menu-btn"
            aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            onClick={() =>
              setTheme((t) => (t === "dark" ? "light" : "dark"))
            }
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            className="topbar__alert-btn"
            aria-label="Alertas"
            onClick={() => navigate("/alertas")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {counts.alertas > 0 && (
              <span className="topbar__badge">{counts.alertas}</span>
            )}
          </button>
          <div className="topbar__avatar">DR</div>
        </div>
      </header>

      <main className="main">
        <div className="main__greeting">
          <p className="main__greeting-sub">{capitalizedDate}</p>
          <h1 className="main__greeting-title">Bienvenido de nuevo, Doctor/a</h1>
        </div>

        <div className="stats">
          
          {stats.map((s) => (
            <div
              key={s.label}
              className="stat-card"
              style={{ "--accent": s.accent }}
            >
              <div className="stat-card__accent-bar" />
              <div className="stat-card__icon">{getStatIcon(s.label)}</div>
              <div className="stat-card__content">
                <p className="stat-card__label">{s.label}</p>
                <p className="stat-card__value">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="section-title">Acciones rápidas</h2>
        <div className="actions-grid">
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`action-card ${action.featured ? "action-card--featured" : ""}`}
              onClick={() => {
                setActiveItem(action.id);
                if (action.path) {
                  navigate(action.path);
                }
              }}
            >
              <div className="action-card__icon">{action.icon}</div>
              <div className="action-card__content">
                {action.badge !== undefined && action.id === "alertas" && (
                  <span className="action-card__badge">
                    {action.badge} alertas
                  </span>
                )}
                <p className="action-card__title">{action.title}</p>
                <p className="action-card__desc">{action.desc}</p>
              </div>
              <span className="action-card__arrow">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </button>
          ))}
        </div>

        <div className="tip-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2a9d8f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>Usa el menú lateral para navegar entre todas las secciones del sistema.</span>
        </div>
      </main>
    </div>
  );
}
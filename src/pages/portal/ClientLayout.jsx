import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, PawPrint, CalendarDays, User, Moon, Sun } from "lucide-react";
import useTheme from "../../hooks/useTheme";
import { useAuth } from "../../auth/AuthContext.jsx";
import "./portal.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const TABS = [
  { to: "/inicio", label: "Inicio", icon: Home, end: true },
  { to: "/mis-mascotas", label: "Mascotas", icon: PawPrint, end: false },
  { to: "/mis-citas", label: "Citas", icon: CalendarDays, end: true },
  { to: "/mi-perfil", label: "Perfil", icon: User, end: true },
];

export default function ClientLayout() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials =
    `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase() ||
    user?.username?.[0]?.toUpperCase() ||
    "?";

  return (
    <div className="portal">
      <header className="portal__topbar">
        <span className="portal__brand">
          Vet<span>Care</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="portal__theme-toggle"
            aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            className="portal__theme-toggle"
            aria-label="Mi perfil"
            onClick={() => navigate("/mi-perfil")}
            style={{ overflow: "hidden", padding: 0 }}
          >
            {user?.profile_photo_url ? (
              <img
                src={`${API_URL}${user.profile_photo_url}`}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 600 }}>{initials}</span>
            )}
          </button>
        </div>
      </header>

      <main className="portal__content">
        <Outlet />
      </main>

      <nav className="portal__tabbar" aria-label="Navegación del portal">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `portal__tab ${isActive ? "portal__tab--active" : ""}`
            }
          >
            <Icon size={22} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

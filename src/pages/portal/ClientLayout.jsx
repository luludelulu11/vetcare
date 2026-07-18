import { NavLink, Outlet } from "react-router-dom";
import { Home, PawPrint, CalendarDays, User, Moon, Sun } from "lucide-react";
import useTheme from "../../hooks/useTheme";
import "./portal.css";

const TABS = [
  { to: "/inicio", label: "Inicio", icon: Home, end: true },
  { to: "/mis-mascotas", label: "Mascotas", icon: PawPrint, end: false },
  { to: "/mis-citas", label: "Citas", icon: CalendarDays, end: true },
  { to: "/mi-perfil", label: "Perfil", icon: User, end: true },
];

export default function ClientLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="portal">
      <header className="portal__topbar">
        <span className="portal__brand">
          Vet<span>Care</span>
        </span>
        <button
          type="button"
          className="portal__theme-toggle"
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
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

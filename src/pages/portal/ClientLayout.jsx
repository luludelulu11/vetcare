import { NavLink, Outlet } from "react-router-dom";
import { Home, PawPrint, CalendarDays, User } from "lucide-react";
import "./portal.css";

const TABS = [
  { to: "/inicio", label: "Inicio", icon: Home, end: true },
  { to: "/mis-mascotas", label: "Mascotas", icon: PawPrint, end: false },
  { to: "/mis-citas", label: "Citas", icon: CalendarDays, end: true },
  { to: "/mi-perfil", label: "Perfil", icon: User, end: true },
];

export default function ClientLayout() {
  return (
    <div className="portal">
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

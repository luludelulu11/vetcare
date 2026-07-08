import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../auth/AuthContext.jsx";
import { getMiPerfil } from "../../services/portalService.js";

const FIELDS = [
  ["Nombre", (p) => [p.first_name, p.last_name].filter(Boolean).join(" ")],
  ["Correo", (p) => p.email],
  ["Teléfono", (p) => p.phone_primary],
  ["Teléfono alt.", (p) => p.phone_secondary],
  ["Dirección", (p) => [p.address_line1, p.address_line2].filter(Boolean).join(", ")],
  ["Ciudad", (p) => [p.city, p.province_state].filter(Boolean).join(", ")],
];

export default function Perfil() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getMiPerfil()
      .then((data) => {
        if (!alive) return;
        setPerfil(data);
        setStatus("ready");
      })
      .catch((e) => {
        if (!alive) return;
        setError(e.message);
        setStatus("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <>
      <h1 className="portal__greeting">Mi perfil</h1>
      <p className="portal__subtitle">Tus datos de contacto en la clínica.</p>

      {status === "loading" && <div className="portal-card">Cargando…</div>}
      {status === "error" && <div className="portal-error">{error}</div>}

      {status === "ready" && perfil && (
        <div className="portal-card">
          <dl style={{ margin: 0 }}>
            {FIELDS.map(([label, get]) => {
              const value = get(perfil);
              if (!value) return null;
              return (
                <div className="profile-field" key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      <button className="portal-logout" onClick={handleLogout}>
        <LogOut size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
        Cerrar sesión
      </button>
    </>
  );
}

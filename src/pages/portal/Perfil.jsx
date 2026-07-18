import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Camera } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../auth/AuthContext.jsx";
import { getMiPerfil, subirFotoPerfil } from "../../services/portalService.js";

const API_URL = import.meta.env.VITE_API_URL || "";

const FIELDS = [
  ["Nombre", (p) => [p.first_name, p.last_name].filter(Boolean).join(" ")],
  ["Correo", (p) => p.email],
  ["Teléfono", (p) => p.phone_primary],
  ["Teléfono alt.", (p) => p.phone_secondary],
  ["Dirección", (p) => [p.address_line1, p.address_line2].filter(Boolean).join(", ")],
  ["Ciudad", (p) => [p.city, p.province_state].filter(Boolean).join(", ")],
];

export default function Perfil() {
  const { logout, user, token, login } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [perfil, setPerfil] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

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

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { profile_photo_url } = await subirFotoPerfil(file);
      setPerfil((prev) => ({ ...prev, profile_photo_url }));
      login({ ...user, profile_photo_url }, token);
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "No se pudo subir la foto.",
        icon: "error",
        confirmButtonColor: "#0f6e84",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const initials =
    `${perfil?.first_name?.[0] || ""}${perfil?.last_name?.[0] || ""}`.toUpperCase() || "?";

  return (
    <>
      <h1 className="portal__greeting">Mi perfil</h1>
      <p className="portal__subtitle">Tus datos de contacto en la clínica.</p>

      {status === "loading" && <div className="portal-card">Cargando…</div>}
      {status === "error" && <div className="portal-error">{error}</div>}

      {status === "ready" && perfil && (
        <div className="portal-card" style={{ textAlign: "center" }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              margin: "0 auto 14px",
              background: "linear-gradient(135deg, var(--brand), var(--brand-dark))",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
              overflow: "hidden",
            }}
          >
            {perfil.profile_photo_url ? (
              <img
                src={`${API_URL}${perfil.profile_photo_url}`}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              initials
            )}
          </div>

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid var(--border-default)",
              background: "var(--surface)",
              color: "var(--brand)",
              borderRadius: 10,
              padding: "9px 16px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              marginBottom: 16,
            }}
          >
            <Camera size={16} />
            {uploading ? "Subiendo..." : "Cambiar foto"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>

          <dl style={{ margin: 0, textAlign: "left" }}>
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

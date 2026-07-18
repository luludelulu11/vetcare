import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import Swal from "sweetalert2";
import PageHeader from "../components/PageHeader.jsx";
import { getPerfil, subirFotoPerfil } from "../services/perfilService.js";
import { useAuth } from "../auth/AuthContext.jsx";
import "./perfil.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const ROLE_LABEL = {
  ADMIN: "Administrador/a",
  DOCTOR: "Doctor/a",
  STAFF: "Secretario/a",
};

export default function Perfil() {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();
  const fileInputRef = useRef(null);

  const [perfil, setPerfil] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let alive = true;
    getPerfil()
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
    `${perfil?.first_name?.[0] || ""}${perfil?.last_name?.[0] || ""}`.toUpperCase() ||
    perfil?.username?.[0]?.toUpperCase() ||
    "?";

  return (
    <div className="perfil-page">
      <div className="perfil-container">
        <PageHeader
          title="Mi perfil"
          subtitle="Tu foto y datos de cuenta"
          onBack={() => navigate("/menu")}
        />

        {status === "loading" && <div className="perfil-card">Cargando…</div>}
        {status === "error" && <div className="perfil-card">{error}</div>}

        {status === "ready" && perfil && (
          <div className="perfil-card">
            <div className="perfil-avatar">
              {perfil.profile_photo_url ? (
                <img src={`${API_URL}${perfil.profile_photo_url}`} alt="" />
              ) : (
                initials
              )}
            </div>

            <p className="perfil-name">
              {[perfil.first_name, perfil.last_name].filter(Boolean).join(" ") ||
                perfil.username}
            </p>
            <p className="perfil-role">{ROLE_LABEL[perfil.role] || perfil.role}</p>

            <label className="perfil-upload-label">
              <Camera size={16} />
              {uploading ? "Subiendo..." : "Cambiar foto"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>

            <dl className="perfil-fields">
              <div className="perfil-field">
                <dt>Usuario</dt>
                <dd>{perfil.username}</dd>
              </div>
              {perfil.email && (
                <div className="perfil-field">
                  <dt>Correo</dt>
                  <dd>{perfil.email}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

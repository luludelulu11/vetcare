import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
import { User, Lock, ShieldCheck } from "lucide-react";
import { isDemoMode } from "../utils/demoMode";
import { demoUser } from "../mock/demoData";



export default function Login() {
  console.log("VITE_DEMO =", import.meta.env.VITE_DEMO);
  const navigate = useNavigate();
  
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "";
  const passType = useMemo(() => (showPass ? "text" : "password"), [showPass]);

  

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isDemoMode = import.meta.env.VITE_DEMO === "true";

const demoUser = {
  id: "demo-admin",
  username: "demo@vetcare.com",
  role: "ADMIN",
};

    if (import.meta.env.VITE_DEMO === "true") {
    localStorage.setItem("token", "demo-token");
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: "demo-admin",
        username: "demo@vetcare.com",
        role: "ADMIN",
      })
    );

    navigate("/menu", { replace: true });
    return;
  }

  setError("");


    if (!usuario.trim() || !contrasena.trim()) {
      setError("Nombre de usuario y contraseña son obligatorios.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usuario,
          password: contrasena,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Inicio de sesión fallido.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/menu");
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vc-body">
      <div className="vc-card">
        <div className="vc-card-header">
          <div className="vc-brand">
            <div className="vc-brand-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2a9d8f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5" />
              <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5" />
              <path d="M8 14v.5A3.5 3.5 0 0 0 11.5 18h1a3.5 3.5 0 0 0 3.5-3.5V14a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2z" />
            </svg>
            </div>
            <div className="vc-brand-name">
              Vet<span>Care</span>
            </div>
          </div>

          <p className="vc-header-tagline">Sistema de gestión veterinaria</p>
        </div>

        <div className="vc-card-body">
          <h1 className="vc-form-title">Bienvenido </h1>
          <p className="vc-form-sub">Introduce tus credenciales para continuar</p>

          <form onSubmit={handleSubmit}>
            <div className="vc-field">
              <label htmlFor="usuario">Nombre de usuario <span class = "req">*</span></label>
              <div className="vc-input-wrap">
                <input
                  type="text"
                  id="usuario"
                  placeholder="Nombre de usuario"
                  autoComplete="username"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                />
                <User className="vc-input-icon" size={18} />
              </div>
            </div>

            <div className="vc-field">
              <label htmlFor="contrasena">Contraseña <span class = "req">*</span></label>
              <div className="vc-input-wrap">
                <input
                  type={passType}
                  id="contrasena"
                  placeholder="contraseña"
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                />
                <Lock className="vc-input-icon" size={18} />

                <button
                  className="vc-toggle-pass"
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "👁‍🗨" : "👁"}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>
                {error}
              </div>
            )}

            <button className="vc-btn-login" type="submit" disabled={loading}>
              {loading ? "Checking..." : "Ingresar"}
            </button>

            

            <div className="cl-note">
              <ShieldCheck size={16} />
    <span>Secure encrypted connection</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
import { useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./login.css";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import SecureNote from "../components/SecureNote";
import { useAuth } from "../auth/AuthContext";
import { roleHome } from "../auth/RequireRole";



export default function Login() {

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const API_URL = import.meta.env.VITE_API_URL || "";
  const passType = useMemo(() => (showPass ? "text" : "password"), [showPass]);
  const resetSuccess = Boolean(location.state?.passwordResetSuccess);

  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usuario.trim() || !contrasena.trim()) {
      setError("Nombre de usuario y contraseña son obligatorios.");
      return;
    }

    setError("");

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

      login(data.user, data.token);

      navigate(roleHome(data.user?.role), { replace: true });
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

          {resetSuccess && (
            <p style={{ color: "#0f6e84", marginBottom: "16px", fontSize: "14px" }}>
              Contraseña actualizada. Ya puedes iniciar sesión.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="vc-field">
              <label htmlFor="usuario">Nombre de usuario <span className="req">*</span></label>
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
              <label htmlFor="contrasena">Contraseña <span className="req">*</span></label>
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
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="vc-row-options">
              <span />
              <Link to="/olvide-contrasena" className="vc-forgot">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <div style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>
                {error}
              </div>
            )}

            <button className="btn-primary-teal" type="submit" disabled={loading}>
              {loading ? "Checking..." : "Ingresar"}
            </button>

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
              ¿No tienes cuenta? <Link to="/registrarse" className="vc-forgot">Regístrate</Link>
            </p>



            <SecureNote />
          </form>
        </div>
      </div>
    </div>
  );
}
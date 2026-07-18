import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./login.css";
import { Lock, Eye, EyeOff } from "lucide-react";
import SecureNote from "../components/SecureNote";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const passType = useMemo(() => (showPass ? "text" : "password"), [showPass]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError("El enlace no es válido. Solicita uno nuevo.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setError("");

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "No se pudo restablecer la contraseña.");
        return;
      }

      navigate("/", { replace: true, state: { passwordResetSuccess: true } });
    } catch {
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
          <p className="vc-header-tagline">Restablecer contraseña</p>
        </div>

        <div className="vc-card-body">
          <h1 className="vc-form-title">Nueva contraseña</h1>
          <p className="vc-form-sub">Elige una nueva contraseña para tu cuenta.</p>

          {!token ? (
            <>
              <div style={{ color: "red", marginBottom: "16px", fontSize: "14px" }}>
                Este enlace no es válido o ya expiró.
              </div>
              <Link to="/olvide-contrasena" className="btn-secondary-light">
                Solicitar un nuevo enlace
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="vc-field">
                <label htmlFor="password">
                  Nueva contraseña <span className="req">*</span>
                </label>
                <div className="vc-input-wrap">
                  <input
                    type={passType}
                    id="password"
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="vc-input-icon" size={18} />
                  <button
                    type="button"
                    className="vc-toggle-pass"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="vc-field">
                <label htmlFor="confirmPassword">
                  Confirmar contraseña <span className="req">*</span>
                </label>
                <div className="vc-input-wrap">
                  <input
                    type={passType}
                    id="confirmPassword"
                    placeholder="Confirma tu nueva contraseña"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Lock className="vc-input-icon" size={18} />
                </div>
              </div>

              {error && (
                <div style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>
                  {error}
                </div>
              )}

              <button className="btn-primary-teal" type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Restablecer contraseña"}
              </button>

              <SecureNote />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

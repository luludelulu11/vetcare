import { useState } from "react";
import { Link } from "react-router-dom";
import "./login.css";
import { User } from "lucide-react";
import SecureNote from "../components/SecureNote";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Introduce tu nombre de usuario.");
      return;
    }

    setError("");

    try {
      setStatus("loading");

      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      // Server always returns the same generic message regardless of
      // outcome — avoids revealing whether an account exists.
      await response.json().catch(() => ({}));

      setStatus("done");
      setError("");
    } catch {
      setStatus("idle");
      setError("No se pudo conectar al servidor.");
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
          <p className="vc-header-tagline">Recuperar contraseña</p>
        </div>

        <div className="vc-card-body">
          <h1 className="vc-form-title">¿Olvidaste tu contraseña?</h1>
          <p className="vc-form-sub">
            Introduce tu nombre de usuario y te enviaremos instrucciones por correo.
          </p>

          {status === "done" ? (
            <>
              <p style={{ color: "#0f6e84", marginBottom: 20 }}>
                Si existe una cuenta con ese usuario, te enviaremos un correo con
                instrucciones para restablecer tu contraseña.
              </p>
              <Link to="/" className="btn-secondary-light">
                Volver al login
              </Link>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="vc-field">
                <label htmlFor="username">
                  Nombre de usuario <span className="req">*</span>
                </label>
                <div className="vc-input-wrap">
                  <input
                    type="text"
                    id="username"
                    placeholder="Nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <User className="vc-input-icon" size={18} />
                </div>
              </div>

              {error && (
                <div style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>
                  {error}
                </div>
              )}

              <button className="btn-primary-teal" type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Enviando..." : "Enviar instrucciones"}
              </button>

              <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
                <Link to="/" className="vc-forgot">Volver al login</Link>
              </p>

              <SecureNote />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

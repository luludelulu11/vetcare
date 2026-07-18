import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";
import { User, Mail, Lock, Phone, IdCard, Eye, EyeOff } from "lucide-react";
import SecureNote from "../components/SecureNote";
import { useAuth } from "../auth/AuthContext";
import { roleHome } from "../auth/RequireRole";
import { applyFieldFormatting, validateFields, validators } from "../utils/formRules";

const API_URL = import.meta.env.VITE_API_URL || "";

const fieldRules = {
  nombre: {
    required: true,
    requiredMessage: "El nombre es obligatorio.",
    formatter: "lettersAndAccents",
  },
  apellido: {
    required: true,
    requiredMessage: "El apellido es obligatorio.",
    formatter: "lettersAndAccents",
  },
  cedula: {
    required: true,
    requiredMessage: "La cédula es obligatoria.",
    formatter: "onlyNumbers",
    validate: [
      { test: validators.exactLength(11), message: "La cédula debe tener exactamente 11 dígitos." },
    ],
  },
  telefono: {
    required: true,
    requiredMessage: "El teléfono es obligatorio.",
    formatter: "onlyNumbers",
    validate: [
      { test: validators.minLength(10), message: "El teléfono no puede tener menos de 10 dígitos." },
    ],
  },
  correo: {
    required: true,
    requiredMessage: "El correo es obligatorio.",
    formatter: "email",
    validate: [{ test: validators.email, message: "El correo no es válido." }],
  },
  password: { required: true, requiredMessage: "La contraseña es obligatoria." },
  confirmPassword: { required: true, requiredMessage: "Debes confirmar la contraseña." },
};

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    correo: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const passType = useMemo(() => (showPass ? "text" : "password"), [showPass]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = applyFieldFormatting(name, value, fieldRules);
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const errors = validateFields(formData, fieldRules);
    if (formData.password && formData.password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres.";
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Corrige los campos marcados.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          cedula: formData.cedula.trim(),
          telefono: formData.telefono.trim(),
          correo: formData.correo.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "No se pudo crear la cuenta.");
        return;
      }

      login(data.user, data.token);
      navigate(roleHome(data.user?.role), { replace: true });
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vc-body">
      <div className="vc-card vc-card--wide">
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
          <p className="vc-header-tagline">Portal de clientes</p>
        </div>

        <div className="vc-card-body">
          <h1 className="vc-form-title">Crear cuenta</h1>
          <p className="vc-form-sub">
            Regístrate para agendar citas y ver el carnet de tus mascotas
          </p>

          <form onSubmit={handleSubmit}>
            <div className="vc-form-grid">
            <div className="vc-field">
              <label htmlFor="nombre">Nombre <span className="req">*</span></label>
              <div className="vc-input-wrap">
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                />
                <User className="vc-input-icon" size={18} />
              </div>
              {fieldErrors.nombre && (
                <small style={{ color: "#e05c4b" }}>{fieldErrors.nombre}</small>
              )}
            </div>

            <div className="vc-field">
              <label htmlFor="apellido">Apellido <span className="req">*</span></label>
              <div className="vc-input-wrap">
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                />
                <User className="vc-input-icon" size={18} />
              </div>
              {fieldErrors.apellido && (
                <small style={{ color: "#e05c4b" }}>{fieldErrors.apellido}</small>
              )}
            </div>

            <div className="vc-field">
              <label htmlFor="cedula">Cédula <span className="req">*</span></label>
              <div className="vc-input-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  id="cedula"
                  name="cedula"
                  placeholder="Cédula (11 dígitos)"
                  value={formData.cedula}
                  onChange={handleChange}
                  maxLength={11}
                />
                <IdCard className="vc-input-icon" size={18} />
              </div>
              {fieldErrors.cedula && (
                <small style={{ color: "#e05c4b" }}>{fieldErrors.cedula}</small>
              )}
            </div>

            <div className="vc-field">
              <label htmlFor="telefono">Teléfono <span className="req">*</span></label>
              <div className="vc-input-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  id="telefono"
                  name="telefono"
                  placeholder="Teléfono"
                  value={formData.telefono}
                  onChange={handleChange}
                  maxLength={10}
                />
                <Phone className="vc-input-icon" size={18} />
              </div>
              {fieldErrors.telefono && (
                <small style={{ color: "#e05c4b" }}>{fieldErrors.telefono}</small>
              )}
            </div>

            <div className="vc-field vc-field--full">
              <label htmlFor="correo">Correo <span className="req">*</span></label>
              <div className="vc-input-wrap">
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  placeholder="Correo electrónico"
                  autoComplete="email"
                  value={formData.correo}
                  onChange={handleChange}
                />
                <Mail className="vc-input-icon" size={18} />
              </div>
              {fieldErrors.correo && (
                <small style={{ color: "#e05c4b" }}>{fieldErrors.correo}</small>
              )}
            </div>

            <div className="vc-field">
              <label htmlFor="password">Contraseña <span className="req">*</span></label>
              <div className="vc-input-wrap">
                <input
                  type={passType}
                  id="password"
                  name="password"
                  placeholder="Contraseña (mín. 8 caracteres)"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
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
              {fieldErrors.password && (
                <small style={{ color: "#e05c4b" }}>{fieldErrors.password}</small>
              )}
            </div>

            <div className="vc-field">
              <label htmlFor="confirmPassword">
                Confirmar contraseña <span className="req">*</span>
              </label>
              <div className="vc-input-wrap">
                <input
                  type={passType}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirma tu contraseña"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <Lock className="vc-input-icon" size={18} />
              </div>
              {fieldErrors.confirmPassword && (
                <small style={{ color: "#e05c4b" }}>{fieldErrors.confirmPassword}</small>
              )}
            </div>
            </div>

            {error && (
              <div style={{ color: "red", marginBottom: "12px", fontSize: "14px" }}>
                {error}
              </div>
            )}

            <button className="btn-primary-teal" type="submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>

            <p style={{ textAlign: "center", marginTop: 16, fontSize: 13 }}>
              ¿Ya tienes cuenta? <Link to="/" className="vc-forgot">Inicia sesión</Link>
            </p>

            <SecureNote />
          </form>
        </div>
      </div>
    </div>
  );
}

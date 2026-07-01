import "./register.css";
import { useState } from "react";
import { User, Mail, Lock, ShieldCheck, Phone, IdCard } from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  applyFieldFormatting,
  validateFields,
  validators,
} from "../utils/formRules";
import { isDemoMode } from "../utils/demoMode";
import { demoClientes } from "../mock/demoData";




export default function CreateAccountVetCare() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
    return;
  }

  try {
    const user = JSON.parse(userRaw);

    if (user.role !== "ADMIN") {
      navigate("/menu", { replace: true });
    }
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  }
}, [navigate]);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

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
        {
          test: validators.exactLength(11),
          message: "La cédula debe tener exactamente 11 dígitos.",
        },
      ],
    },
    telefono: {
      required: true,
      requiredMessage: "El teléfono es obligatorio.",
      formatter: "onlyNumbers",
      validate: [
        {
          test: validators.minLength(10),
          message: "El teléfono no puede tener menos de 10 dígitos.",
        },
      ],
    },
    email: {
      required: true,
      requiredMessage: "El email es obligatorio.",
      formatter: "email",
      validate: [
        {
          test: validators.email,
          message: "El email no es válido.",
        },
      ],
    },
    password: {
      required: true,
      requiredMessage: "La contraseña es obligatoria.",
    },
    confirmPassword: {
      required: true,
      requiredMessage: "Debes confirmar la contraseña.",
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const formattedValue = applyFieldFormatting(name, value, fieldRules);

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setFieldErrors({});

    const errors = validateFields(formData, fieldRules);

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Corrige los campos marcados.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/", { replace: true });
      return;
    }

     if (isDemoMode) {
  setMascotas(demoMascotas);
  setLoading(false);
  return;
}

    try {
      setLoading(true);

      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.email.trim(),
          password: formData.password.trim(),
          role: "ADMIN",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "No se pudo crear la cuenta.");
        return;
      }

      setSuccess("Cuenta creada correctamente. Ahora puedes iniciar sesión.");

      setFormData({
        nombre: "",
        apellido: "",
        cedula: "",
        telefono: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch {
      setError("Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cl-body">
      <div className="cl-card">
        <div className="cl-header">
          <div className="cl-header-circle cl-header-circle--left"></div>
          <div className="cl-header-circle cl-header-circle--right"></div>

          <button
            type="button"
            className="cl-header-back"
            onClick={() => navigate("/menu")}
          >
            ← Volver
          </button>

          <div className="cl-header-content">
            <h1 className="cl-title">Agregar usuario</h1>
            <p className="cl-sub">Llena la informacion para continuar</p>
          </div>
        </div>

        <div className="cl-form-body">
          <div className="cl-form-container">
            <form className="cl-form" onSubmit={handleSubmit}>
  <div className="cl-form-grid">
    <div className="cl-field">
      <label>NOMBRE <span className="req">*</span></label>
      <div className="cl-input-wrap">
        <User size={18} />
        <input
          type="text"
          name="nombre"
          placeholder="Introduce tu nombre"
          value={formData.nombre}
          onChange={handleChange}
        />
      </div>
      {fieldErrors.nombre && <small>{fieldErrors.nombre}</small>}
    </div>

    <div className="cl-field">
      <label>APELLIDO <span className="req">*</span></label>
      <div className="cl-input-wrap">
        <User size={18} />
        <input
          type="text"
          name="apellido"
          placeholder="Introduce tu apellido"
          value={formData.apellido}
          onChange={handleChange}
        />
      </div>
      {fieldErrors.apellido && <small>{fieldErrors.apellido}</small>}
    </div>

    <div className="cl-field">
      <label>CÉDULA <span className="req">*</span></label>
      <div className="cl-input-wrap">
        <IdCard size={18} />
        <input
          type="text"
          name="cedula"
          placeholder="Introduce tu cédula"
          value={formData.cedula}
          onChange={handleChange}
          maxLength={11}
        />
      </div>
      {fieldErrors.cedula && <small>{fieldErrors.cedula}</small>}
    </div>

    <div className="cl-field">
      <label>TELÉFONO <span className="req">*</span></label>
      <div className="cl-input-wrap">
        <Phone size={18} />
        <input
          type="text"
          name="telefono"
          placeholder="Introduce tu teléfono"
          value={formData.telefono}
          onChange={handleChange}
          maxLength={10}
        />
      </div>
      {fieldErrors.telefono && <small>{fieldErrors.telefono}</small>}
    </div>

    <div className="cl-field cl-field-full">
      <label>EMAIL <span className="req">*</span></label>
      <div className="cl-input-wrap">
        <Mail size={18} />
        <input
          type="email"
          name="email"
          placeholder="Introduce tu dirección de email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      {fieldErrors.email && <small>{fieldErrors.email}</small>}
    </div>

    <div className="cl-field">
      <label>CONTRASEÑA <span className="req">*</span></label>
      <div className="cl-input-wrap">
        <Lock size={18} />
        <input
          type="password"
          name="password"
          placeholder="Introduce una contraseña"
          value={formData.password}
          onChange={handleChange}
        />
      </div>
      {fieldErrors.password && <small>{fieldErrors.password}</small>}
    </div>

    <div className="cl-field">
      <label>CONFIRMAR CONTRASEÑA <span className="req">*</span></label>
      <div className="cl-input-wrap">
        <Lock size={18} />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirma tu contraseña"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
      </div>
      {fieldErrors.confirmPassword && (
        <small>{fieldErrors.confirmPassword}</small>
      )}
    </div>
  </div>

  {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
  {success && <p style={{ color: "green", marginTop: "10px" }}>{success}</p>}

  <button type="submit" className="cl-btn-primary" disabled={loading}>
    {loading ? "CREANDO..." : "CREAR CUENTA"}
  </button>

  <Link to="/" className="cl-btn-secondary">
    Ir al Login
  </Link>

  <div className="cl-note">
    <ShieldCheck size={16} />
    <span>Secure encrypted connection</span>
  </div>
</form>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./clientes.css";
import { User, IdCard, MapPin, Mail, Phone } from "lucide-react";
import {
  applyFieldFormatting,
  validateFields,
  validators,
} from "../utils/formRules";
import Swal from "sweetalert2";
import FormHeader from "../components/FormHeader";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Clientes() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    cedula: "",
    cedula_display: "",
    direccion: "",
    correo: "",
    telefono: "",
    telefono_display: "",
    telefono2: "",
    telefono2_display: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const fieldRules = {
  nombre: {
    required: true,
    formatter: "lettersAndAccents",
    requiredMessage: "El nombre es obligatorio.",
  },
  cedula: {
    required: true,
    formatter: "cedula",
    requiredMessage: "La cédula es obligatoria.",
    validate: [
      {
        test: validators.exactLength(11),
        message: "La cédula debe tener exactamente 11 dígitos.",
      },
    ],
  },
  telefono: {
    required: true,
    formatter: "phone",
    requiredMessage: "El teléfono es obligatorio.",
    validate: [
      {
        test: validators.minLength(10),
        message: "El teléfono no puede tener menos de 10 dígitos.",
      },
    ],
  },
  telefono2: {
    formatter: "phone",
  },
  correo: {
    required: true,
    requiredMessage: "El correo es obligatorio.",
    validate: [
      {
        test: validators.email,
        message: "Correo inválido.",
      },
    ],
  },
};

 const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === "cedula" || name === "telefono" || name === "telefono2") {
    const raw = String(value).replace(/\D/g, "");
    const displayValue = applyFieldFormatting(name, value, fieldRules);

    setForm((prev) => ({
      ...prev,
      [name]: raw,
      [`${name}_display`]: displayValue,
    }));
  } else {
    const formattedValue = applyFieldFormatting(name, value, fieldRules);

    setForm((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  }

  setFieldErrors((prev) => ({
    ...prev,
    [name]: "",
  }));
  setError("");
};
  const handleGuardar = async (e) => {
    e.preventDefault();

    setError("");
    setFieldErrors({});
    
console.log("cedula raw:", form.cedula);
console.log("cedula display:", form.cedula_display);
console.log("cedula digits:", String(form.cedula).replace(/\D/g, "").length);


    const errors = validateFields(
  {
    ...form,
    cedula: String(form.cedula).replace(/\D/g, ""),
    telefono: String(form.telefono).replace(/\D/g, ""),
    telefono2: String(form.telefono2 || "").replace(/\D/g, ""),
  },
  fieldRules
);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Corrige los campos.");
      return;
    }

      
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const payload = {
        nombre: form.nombre,
        cedula: form.cedula,
        direccion: form.direccion,
        correo: form.correo,
        telefono: form.telefono,
        telefono2: form.telefono2,
      };

      

      const response = await fetch(`${API_URL}/api/clientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const raw = await response.text();

      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {}

      if (!response.ok) {
        Swal.fire({
          title: "Error",
          text: data.message || "No se pudo guardar el usuario.",
          timer: 4000,
          showConfirmButton: false,
          icon: "error",
        });
        return;
      }

      Swal.fire({
        title: "Listo",
        text: data.message || "Usuario guardado exitosamente.",
        icon: "success",
        timer: 4000,
        showConfirmButton: false,
      });

      setForm({
        nombre: "",
        cedula: "",
        cedula_display: "",
        direccion: "",
        correo: "",
        telefono: "",
        telefono_display: "",
        telefono2: "",
        telefono2_display: "",
      });
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cl-body">
      <div className="cl-card">
        <FormHeader
                title="Registrar usuario"
                subtitle="Completa los datos del usuario"
              />

        <form className="cl-form" onSubmit={handleGuardar}>
          <div className="cl-grid-2">
            <div className="cl-field">
              <label>
                Nombre <span className="req">*</span>
              </label>
              <div className="cl-input-wrap">
                <User size={20} />
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Nombre"
                />
              </div>
              {fieldErrors.nombre && (
                <small className="cl-error-text">{fieldErrors.nombre}</small>
              )}
            </div>

            <div className="cl-field">
              <label>
                Cédula <span className="req">*</span>
              </label>
              <div className="cl-input-wrap">
                <IdCard size={20} />
                <input
                  name="cedula"
                  value={form.cedula_display}
                  onChange={handleChange}
                  placeholder="000-0000000-0"
                />
              </div>
              {fieldErrors.cedula && (
                <small className="cl-error-text">{fieldErrors.cedula}</small>
              )}
            </div>
          </div>

          <div className="cl-grid-2">
            <div className="cl-field">
              <label>
                Dirección <span className="req">*</span>
              </label>
              <div className="cl-input-wrap">
                <MapPin size={20} />
                <input
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Dirección"
                />
              </div>
            </div>

            <div className="cl-field">
              <label>
                Correo <span className="req">*</span>
              </label>
              <div className="cl-input-wrap">
                <Mail size={20} />
                <input
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  placeholder="correo@noemail.com"
                />
              </div>
              {fieldErrors.correo && (
                <small className="cl-error-text">{fieldErrors.correo}</small>
              )}
            </div>
          </div>

          <div className="cl-grid-2">
            <div className="cl-field">
              <label>
                Teléfono <span className="req">*</span>
              </label>
              <div className="cl-input-wrap">
                <Phone size={20} />
                <input
                  name="telefono"
                  value={form.telefono_display}
                  onChange={handleChange}
                  placeholder="000-000-0000"
                />
              </div>
              {fieldErrors.telefono && (
                <small className="cl-error-text">{fieldErrors.telefono}</small>
              )}
            </div>

            <div className="cl-field">
              <label>Teléfono secundario <span class="cl-field-optional-tag">(opcional)</span>
              </label>
              <div className="cl-input-wrap">
                <Phone size={20} />
                <input
                  name="telefono2"
                  value={form.telefono2_display}
                  onChange={handleChange}
                  placeholder="000-000-0000"
                />
              </div>
            </div>
          </div>

          <button className="btn-primary-teal" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar usuario"}
          </button>

          <button
            className="btn-secondary-light"
            type="button"
            onClick={() => navigate("/menu")}
          >
            Volver al menú
          </button>
        </form>
      </div>
    </div>
  );
}
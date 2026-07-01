import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./mascotas.css";
import { Search, PawPrint, Calendar, Tag, Scale } from "lucide-react";
import {
  applyFieldFormatting,
  validateFields,
  validators,
} from "../utils/formRules";
import Swal from "sweetalert2";
import { isDemoMode } from "../utils/demoMode";
import { demoClientes } from "../mock/demoData";

const API_URL = "http://localhost:5000";

export default function Mascotas() {
  const navigate = useNavigate();
  const clienteSearchRef = useRef(null);

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);

  const [clienteSearch, setClienteSearch] = useState("");
  const [showClienteResults, setShowClienteResults] = useState(false);
  const [highlightedClienteIndex, setHighlightedClienteIndex] = useState(-1);

  const [form, setForm] = useState({
    clienteId: "",
    nombre: "",
    edad: "",
    raza: "",
    sexo: "",
    peso: "",
    observaciones: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const fieldRules = {
    clienteId: {
      required: true,
      requiredMessage: "Debe seleccionar un usuario.",
    },
    nombre: {
      required: true,
      formatter: "lettersAndAccents",
      requiredMessage: "El nombre es obligatorio.",
    },
    edad: {
      required: true,
      formatter: "decimalNumber",
      requiredMessage: "La edad es obligatoria.",
      validate: [
        {
          test: validators.minLength(1),
          message: "La edad es obligatoria.",
        },
      ],
    },
    raza: {
      required: true,
      formatter: "lettersAndAccents",
      requiredMessage: "La raza es obligatoria.",
    },
    sexo: {
      required: true,
      requiredMessage: "El sexo es obligatorio.",
    },
    peso: {
      required: true,
      formatter: "decimalNumber",
      requiredMessage: "El peso es obligatorio.",
      validate: [
        {
          test: validators.minLength(1),
          message: "El peso es obligatorio.",
        },
      ],
    },
    observaciones: {},
  };

  useEffect(() => {
    const loadClientes = async () => {
      try {
        setLoadingClientes(true);
        setError("");

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

        const response = await fetch(`${API_URL}/api/clientes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const raw = await response.text();

        let data = [];
        try {
          data = raw ? JSON.parse(raw) : [];
        } catch {
          data = [];
        }

        if (!response.ok) {
          setError(data?.message || "No se pudieron cargar los usuarios.");
          return;
        }

        const normalizedClientes = Array.isArray(data)
          ? data.map((cliente) => ({
              id:
                cliente.id ??
                cliente.Id ??
                cliente.ID ??
                cliente.clienteId ??
                cliente.ClienteId ??
                cliente._id ??
                "",
              nombre:
                cliente.nombre ??
                cliente.Nombre ??
                cliente.nombreCompleto ??
                cliente.NombreCompleto ??
                "",
              cedula:
                cliente.cedula ??
                cliente.Cedula ??
                cliente.national_id ??
                "",
              telefono:
                cliente.telefono ??
                cliente.Telefono ??
                cliente.phone ??
                cliente.Phone ??
                "",
            }))
          : [];

        setClientes(normalizedClientes);
      } catch (err) {
        console.error(err);
        setError("No se pudo conectar con el servidor.");
      } finally {
        setLoadingClientes(false);
      }
    };

    loadClientes();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        clienteSearchRef.current &&
        !clienteSearchRef.current.contains(event.target)
      ) {
        setShowClienteResults(false);
        setHighlightedClienteIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClientes = useMemo(() => {
    const term = clienteSearch.trim().toLowerCase();

    if (!term) return clientes;

    return clientes.filter((cliente) => {
      const nombre = (cliente.nombre || "").toLowerCase();
      const cedula = String(cliente.cedula || "").toLowerCase();
      const telefono = String(cliente.telefono || "").toLowerCase();
      const id = String(cliente.id || "").toLowerCase();

      return (
        nombre.includes(term) ||
        cedula.includes(term) ||
        telefono.includes(term) ||
        id.includes(term)
      );
    });
  }, [clientes, clienteSearch]);

  const selectCliente = (cliente) => {
    setForm((prev) => ({
      ...prev,
      clienteId: cliente.id,
    }));

    setClienteSearch(
      [cliente.nombre, cliente.cedula].filter(Boolean).join(" - ")
    );

    setFieldErrors((prev) => ({
      ...prev,
      clienteId: "",
    }));

    setShowClienteResults(false);
    setHighlightedClienteIndex(-1);
  };

  const handleClienteSearchKeyDown = (e) => {
    if (!showClienteResults && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setShowClienteResults(true);
      return;
    }

    if (!filteredClientes.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedClienteIndex((prev) =>
        prev < filteredClientes.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedClienteIndex((prev) =>
        prev > 0 ? prev - 1 : filteredClientes.length - 1
      );
    }

    if (e.key === "Enter" && highlightedClienteIndex >= 0) {
      e.preventDefault();
      selectCliente(filteredClientes[highlightedClienteIndex]);
    }

    if (e.key === "Escape") {
      setShowClienteResults(false);
      setHighlightedClienteIndex(-1);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = applyFieldFormatting(name, value, fieldRules);

    if (name === "edad") {
      formattedValue = formattedValue.slice(0, 5);
    }

    if (name === "peso") {
      formattedValue = formattedValue.slice(0, 6);
    }

    setForm((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (clientes.length === 0) {
      setError("Debes registrar al menos un usuario primero.");
      return;
    }

    const errors = validateFields(form, fieldRules);

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Corrige los campos requeridos.");
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

      const response = await fetch(`${API_URL}/api/mascotas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
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
      } catch {
        data = {};
      }

      if (!response.ok) {
        Swal.fire({
          title: "Error",
          text: data.message || "La mascota no pudo ser guardada.",
          timer: 4000,
          showConfirmButton: false,
          icon: "error",
        });
        return;
      }

      Swal.fire({
        title: "Listo",
        text: data.message || "La mascota fue guardada exitosamente.",
        icon: "success",
        timer: 4000,
        showConfirmButton: false,
      });

      setForm({
        clienteId: "",
        nombre: "",
        edad: "",
        raza: "",
        sexo: "",
        peso: "",
        observaciones: "",
      });

      setClienteSearch("");
      setShowClienteResults(false);
      setHighlightedClienteIndex(-1);
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ms-body">
      <div className="ms-card">
        <div className="ms-header">
          <h1 className="ms-title">Mascotas</h1>
          <p className="ms-sub">Registra la información de la mascota</p>
        </div>

        <form className="ms-form" onSubmit={handleGuardar}>
          <div className="ms-grid-2">
            <div className="ms-field">
              <label htmlFor="clienteSearch">
                Usuario asociado <span className="req">*</span>
              </label>

              <div className="ms-search-wrap" ref={clienteSearchRef}>
                <div className="ms-input-wrap">
                  <Search size={20} />
                  <input
                    id="clienteSearch"
                    name="clienteSearch"
                    type="text"
                    placeholder={
                      loadingClientes ? "Cargando usuarios..." : "Buscar usuario..."
                    }
                    value={clienteSearch}
                    onChange={(e) => {
                      setClienteSearch(e.target.value);
                      setShowClienteResults(true);
                      setHighlightedClienteIndex(-1);
                      setForm((prev) => ({
                        ...prev,
                        clienteId: "",
                      }));
                      setFieldErrors((prev) => ({
                        ...prev,
                        clienteId: "",
                      }));
                    }}
                    onFocus={() => setShowClienteResults(true)}
                    onKeyDown={handleClienteSearchKeyDown}
                    autoComplete="off"
                    disabled={loadingClientes}
                  />
                </div>

                {showClienteResults && !loadingClientes && (
                  <div className="ms-search-results">
                    {filteredClientes.length > 0 ? (
                      filteredClientes.slice(0, 8).map((cliente, index) => (
                        <button
                          type="button"
                          key={cliente.id}
                          className={`ms-search-item ${
                            highlightedCliente === index ? "active" : ""
                          }`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCliente(cliente)}
                        >
                          <span className="ms-search-name">{cliente.nombre}</span>
                          <span className="ms-search-meta">
                            {cliente.cedula || `ID: ${cliente.id}`}
                            {cliente.telefono ? ` • ${cliente.telefono}` : ""}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="ms-search-empty">
                        No se encontraron usuarios
                      </div>
                    )}
                  </div>
                )}
              </div>

              {fieldErrors.clienteId && (
                <small className="cl-error-text">{fieldErrors.clienteId}</small>
              )}
            </div>

            <div className="ms-field">
              <label htmlFor="nombre">
                Nombre <span className="req">*</span>
              </label>
              <div className="ms-input-wrap">
                <PawPrint size={20} />
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={handleChange}
                />
              </div>
              {fieldErrors.nombre && (
                <small className="cl-error-text">{fieldErrors.nombre}</small>
              )}
            </div>
          </div>

          <div className="ms-grid-2">
            <div className="ms-field">
              <label htmlFor="edad">
                Edad <span className="req">*</span>
              </label>
              <div className="ms-input-wrap">
                <Calendar size={20} />
                <input
                  id="edad"
                  name="edad"
                  type="text"
                  placeholder="Edad"
                  value={form.edad ? `${form.edad} años` : ""}
                  onChange={(e) => {
                    const clean = e.target.value.replace(" años", "");
                    handleChange({ target: { name: "edad", value: clean } });
                  }}
                />
              </div>
              {fieldErrors.edad && (
                <small className="cl-error-text">{fieldErrors.edad}</small>
              )}
            </div>

            <div className="ms-field">
              <label htmlFor="raza">
                Raza <span className="req">*</span>
              </label>
              <div className="ms-input-wrap">
                <Tag size={20} />
                <input
                  id="raza"
                  name="raza"
                  type="text"
                  placeholder="Raza"
                  value={form.raza}
                  onChange={handleChange}
                />
              </div>
              {fieldErrors.raza && (
                <small className="cl-error-text">{fieldErrors.raza}</small>
              )}
            </div>
          </div>

          <div className="ms-grid-2">
            <div className="ms-field">
              <label htmlFor="sexo">
                Sexo <span className="req">*</span>
              </label>
              <select
                id="sexo"
                name="sexo"
                value={form.sexo}
                onChange={handleChange}
              >
                <option value="">Seleccionar…</option>
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
              {fieldErrors.sexo && (
                <small className="cl-error-text">{fieldErrors.sexo}</small>
              )}
            </div>

            <div className="ms-field">
              <label htmlFor="peso">
                Peso <span className="req">*</span>
              </label>
              <div className="ms-input-wrap">
                <Scale size={20} />
                <input
                  id="peso"
                  name="peso"
                  type="text"
                  placeholder="Peso"
                  value={form.peso ? `${form.peso} kg` : ""}
                  onChange={(e) => {
                    const clean = e.target.value.replace(" kg", "");
                    handleChange({ target: { name: "peso", value: clean } });
                  }}
                />
              </div>
              {fieldErrors.peso && (
                <small className="cl-error-text">{fieldErrors.peso}</small>
              )}
            </div>
          </div>

          <div className="ms-field">
            <label htmlFor="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              name="observaciones"
              placeholder="Observaciones"
              value={form.observaciones}
              onChange={handleChange}
            />
          </div>

          {error && <small className="cl-error-text">{error}</small>}

          <button className="ms-btn-primary" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar mascota"}
          </button>

          <button
            className="ms-link"
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
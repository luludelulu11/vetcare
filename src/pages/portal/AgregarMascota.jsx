import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { crearMascota } from "../../services/portalService.js";

const ESPECIES = ["Perro", "Gato"];
const SEXOS = ["Macho", "Hembra"];

export default function AgregarMascota() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [especie, setEspecie] = useState("");
  const [sexo, setSexo] = useState("");
  const [raza, setRaza] = useState("");
  const [edad, setEdad] = useState("");
  const [peso, setPeso] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) return setFormError("El nombre de tu mascota es requerido.");

    setFormError("");

    try {
      setSaving(true);
      await crearMascota({
        nombre: nombre.trim(),
        especie,
        sexo,
        raza: raza.trim(),
        edad: edad ? Number(edad) : undefined,
        peso: peso ? Number(peso) : undefined,
        observaciones: observaciones.trim(),
      });

      await Swal.fire({
        icon: "success",
        title: "¡Mascota registrada!",
        text: `${nombre.trim()} ya forma parte de tu familia VetCare.`,
        timer: 2200,
        showConfirmButton: false,
      });

      navigate("/mis-mascotas", { replace: true });
    } catch (err) {
      setFormError(err.message || "No se pudo registrar la mascota.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="portal__greeting">Agregar mascota</h1>
      <p className="portal__subtitle">Registra a tu mascota para agendar citas y llevar su historial.</p>

      <form className="cita-form" onSubmit={handleSubmit}>
        <p className="cita-label">Nombre</p>
        <input
          type="text"
          className="cita-date"
          placeholder="Nombre de tu mascota"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <p className="cita-label">Especie</p>
        <div className="chip-row">
          {ESPECIES.map((e) => (
            <button
              key={e}
              type="button"
              className={`chip-option ${especie === e ? "chip-option--active" : ""}`}
              onClick={() => setEspecie(e)}
            >
              {e}
            </button>
          ))}
        </div>

        <p className="cita-label">Sexo</p>
        <div className="chip-row">
          {SEXOS.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip-option ${sexo === s ? "chip-option--active" : ""}`}
              onClick={() => setSexo(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="cita-label">Raza (opcional)</p>
        <input
          type="text"
          className="cita-date"
          placeholder="Ej. Labrador, Mestizo..."
          value={raza}
          onChange={(e) => setRaza(e.target.value)}
        />

        <p className="cita-label">Edad en años (opcional)</p>
        <input
          type="number"
          min="0"
          className="cita-date"
          placeholder="Edad"
          value={edad}
          onChange={(e) => setEdad(e.target.value)}
        />

        <p className="cita-label">Peso en kg (opcional)</p>
        <input
          type="number"
          min="0"
          step="0.1"
          className="cita-date"
          placeholder="Peso"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
        />

        <p className="cita-label">Observaciones (opcional)</p>
        <textarea
          className="cita-textarea"
          rows={3}
          placeholder="Alergias, condiciones especiales..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
        />

        {formError && <div className="portal-error">{formError}</div>}

        <button type="submit" className="btn-primary-teal" disabled={saving}>
          {saving ? "Guardando..." : "Registrar mascota"}
        </button>
      </form>
    </>
  );
}

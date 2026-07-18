import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import PageHeader from "../components/PageHeader.jsx";
import { getAppointmentTypes } from "../services/portalService.js";
import {
  updateAppointmentTypePrice,
  updateAggressivePetSurcharge,
} from "../services/adminService.js";
import "./perfil.css";
import "./adminServicios.css";

export default function AdminServicios() {
  const navigate = useNavigate();
  const [tipos, setTipos] = useState([]);
  const [precios, setPrecios] = useState({});
  const [surcharge, setSurcharge] = useState("0");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    getAppointmentTypes()
      .then((data) => {
        if (!alive) return;
        setTipos(data.types || []);
        setPrecios(
          Object.fromEntries((data.types || []).map((t) => [t.id, String(t.price ?? 0)]))
        );
        setSurcharge(String(data.aggressivePetSurcharge ?? 0));
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

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await Promise.all([
        ...tipos.map((t) => updateAppointmentTypePrice(t.id, Number(precios[t.id]))),
        updateAggressivePetSurcharge(Number(surcharge)),
      ]);

      await Swal.fire({
        icon: "success",
        title: "Precios actualizados",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "No se pudieron guardar los cambios.",
        icon: "error",
        confirmButtonColor: "#0f6e84",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="perfil-page">
      <div className="perfil-container">
        <PageHeader
          title="Servicios y precios"
          subtitle="Precios en pesos dominicanos (RD$)"
          onBack={() => navigate("/menu")}
        />

        {status === "loading" && <div className="perfil-card">Cargando…</div>}
        {status === "error" && <div className="perfil-card">{error}</div>}

        {status === "ready" && (
          <>
            <div className="servicios-card">
              <h2>Precios por servicio</h2>
              <p className="servicios-hint">
                Precio base que se cobra por cada tipo de cita.
              </p>

              {tipos.map((t) => (
                <div className="servicios-row" key={t.id}>
                  <div>
                    <p className="servicios-row-name">{t.name}</p>
                    {t.description && <p className="servicios-row-desc">{t.description}</p>}
                  </div>
                  <div className="servicios-price-input">
                    <span>RD$</span>
                    <input
                      type="number"
                      min="0"
                      value={precios[t.id] ?? ""}
                      onChange={(e) =>
                        setPrecios((prev) => ({ ...prev, [t.id]: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="servicios-card">
              <h2>Recargo por mascota agresiva</h2>
              <p className="servicios-hint">
                Se suma al precio base cuando el cliente marca su mascota como agresiva
                (posible necesidad de sedante).
              </p>
              <div className="servicios-row" style={{ borderBottom: "none" }}>
                <p className="servicios-row-name">Recargo</p>
                <div className="servicios-price-input">
                  <span>RD$</span>
                  <input
                    type="number"
                    min="0"
                    value={surcharge}
                    onChange={(e) => setSurcharge(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary-teal servicios-save-btn"
              onClick={handleGuardar}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

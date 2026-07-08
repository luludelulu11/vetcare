import "./historialClinico.css";

/**
 * Printable clinical-history document. Role-agnostic: staff and client pages
 * normalize their data into these props and render this.
 *
 * props:
 *   pet:    { nombre, especie, raza, sexo, edad, peso, observaciones }
 *   owner:  { nombre, telefono, email } | null
 *   consultas: [{
 *     fecha, doctor, tipos, motivo, diagnostico, observaciones,
 *     vitals: { peso, temp, fc, fr, pa, sat },
 *     medicaciones: [{ medicamento, indicaciones }],
 *     analisis: [{ analisis, resultado_observacion }],
 *     vacunas: [{ vacuna, fecha_aplicacion, fecha_refuerzo, lote, laboratorio, veterinario }],
 *   }]
 *   screenHidden: when true, the doc is invisible on screen but still prints
 *     (used by staff, whose page already shows the history UI).
 */
function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="hc-field">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function vitalsLine(v = {}) {
  const parts = [
    v.peso && `Peso ${v.peso} kg`,
    v.temp && `Temp ${v.temp}°C`,
    v.fc && `FC ${v.fc}`,
    v.fr && `FR ${v.fr}`,
    v.pa && `PA ${v.pa}`,
    v.sat && `SatO₂ ${v.sat}%`,
  ].filter(Boolean);
  return parts.join(" · ");
}

export default function HistorialClinicoDoc({
  pet = {},
  owner = null,
  consultas = [],
  screenHidden = false,
}) {
  const petMeta = [
    pet.especie,
    pet.raza,
    pet.sexo,
    pet.edad && `${pet.edad} ${Number(pet.edad) === 1 ? "año" : "años"}`,
    pet.peso && `${pet.peso} kg`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={`hc-doc ${screenHidden ? "hc-doc--print-only" : ""}`}>
      <header className="hc-header">
        <div className="hc-brand">VetCare</div>
        <div className="hc-doc-title">Historial Clínico</div>
        <div className="hc-emitted">Emitido el {fmtDate(new Date())}</div>
      </header>

      <section className="hc-identity">
        <div>
          <h2 className="hc-pet-name">{pet.nombre || "Mascota"}</h2>
          <p className="hc-pet-meta">{petMeta || "Sin datos"}</p>
        </div>
        {owner && (
          <dl className="hc-owner">
            <Row label="Propietario" value={owner.nombre} />
            <Row label="Teléfono" value={owner.telefono} />
            <Row label="Correo" value={owner.email} />
          </dl>
        )}
      </section>

      {pet.observaciones && (
        <p className="hc-observations">
          <strong>Observaciones:</strong> {pet.observaciones}
        </p>
      )}

      <h3 className="hc-section-title">
        Consultas ({consultas.length})
      </h3>

      {consultas.length === 0 && (
        <p className="hc-empty">No hay consultas registradas para esta mascota.</p>
      )}

      {consultas.map((c, i) => (
        <section className="hc-consulta" key={i}>
          <div className="hc-consulta-head">
            <span className="hc-consulta-date">{fmtDate(c.fecha)}</span>
            {c.tipos && <span className="hc-consulta-type">{c.tipos}</span>}
            {c.doctor && <span className="hc-consulta-doc">Dr(a). {c.doctor}</span>}
          </div>

          <dl className="hc-fields">
            <Row label="Motivo" value={c.motivo} />
            <Row label="Diagnóstico" value={c.diagnostico} />
            <Row label="Observaciones" value={c.observaciones} />
            <Row label="Signos vitales" value={vitalsLine(c.vitals)} />
          </dl>

          {Array.isArray(c.medicaciones) && c.medicaciones.length > 0 && (
            <div className="hc-sub">
              <h4>Medicación</h4>
              <ul>
                {c.medicaciones.map((m, j) => (
                  <li key={j}>
                    {m.medicamento}
                    {m.indicaciones ? ` — ${m.indicaciones}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(c.analisis) && c.analisis.length > 0 && (
            <div className="hc-sub">
              <h4>Análisis</h4>
              <ul>
                {c.analisis.map((a, j) => (
                  <li key={j}>
                    {a.analisis}
                    {a.resultado_observacion ? ` — ${a.resultado_observacion}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(c.vacunas) && c.vacunas.length > 0 && (
            <div className="hc-sub">
              <h4>Vacunas</h4>
              <ul>
                {c.vacunas.map((v, j) => (
                  <li key={j}>
                    {v.vacuna}
                    {v.fecha_refuerzo ? ` (refuerzo ${fmtDate(v.fecha_refuerzo)})` : ""}
                    {v.lote ? ` · lote ${v.lote}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}

      <footer className="hc-footer">
        Documento generado desde VetCare · {fmtDate(new Date())}
      </footer>
    </article>
  );
}

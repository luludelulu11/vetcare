import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import styles from "./consultas.module.css";
import {
  applyFieldFormatting,
  validateFields,
  validators,
  finalizeDecimal,
} from "../utils/formRules";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL || "";

const STATUS_OPTS = [
  { id: "open", label: "Abierta", colorClass: styles.statusOpen },
  { id: "follow", label: "Seguimiento", colorClass: styles.statusFollow },
  { id: "closed", label: "Cerrada", colorClass: styles.statusClosed },
];

const SEVERITY_OPTS = [
  { id: "low", label: "Leve", colorClass: styles.sevLow },
  { id: "med", label: "Moderada", colorClass: styles.sevMed },
  { id: "high", label: "Alta", colorClass: styles.sevHigh },
  { id: "crit", label: "Crítica", colorClass: styles.sevCrit },
];

const STEP_TABS = [
  { id: 0, label: "Identificación" },
  { id: 1, label: "Tipo y vitales" },
  { id: 2, label: "Diagnóstico" },
  { id: 3, label: "Tratamiento" },
];

function genId() {
  const year = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 9000) + 1000);
  return `#EXP-${year}-${n}`;
}

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function buildDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return new Date();
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function initials(str = "") {
  return str
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getVisitTypeColorClass(codigo) {
  const map = {
    vac: styles.typeVac,   // vacunas
    gen: styles.typeGen,   // general
    ill: styles.typeIll,   // enfermedad
    sur: styles.typeSur,   // cirugía
    med: styles.typeMed,   // medicación
    den: styles.typeDen,   // dental
    rou: styles.typeRou,   // rutina
    eme: styles.typeEme,   // emergencia
    emb: styles.typeEmb,   // embarazo
  };

  return map[codigo] || styles.typeDefault;

}

function SectionCard({ icon, title, children, className = "" }) {
  return (
    <div className={`${styles.sectionCard} ${className}`}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionIcon}>{icon}</div>
        <span className={styles.sectionTitle}>{title}</span>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Field({ label, children, full = false, required = false }) {
  return (
    <div className={`${styles.field} ${full ? styles.fieldFull : ""}`}>
      {label && (
        <label className={styles.fieldLabel}>
          {label} {required && <span className={styles.req}>*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function TagInput({ tags, onAdd, onRemove, placeholder }) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue("");
  };

  return (
    <>
      {tags.length > 0 && (
        <div className={styles.tagRow}>
          {tags.map((t, i) => (
            <span key={i} className={styles.tag}>
              {t}
              <span className={styles.tagDel} onClick={() => onRemove(i)}>
                ×
              </span>
            </span>
          ))}
        </div>
      )}

      <div className={styles.tagInputRow}>
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button type="button" className={styles.addBtn} onClick={handleAdd}>
          + Agregar
        </button>
      </div>
    </>
  );
}

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 12h6M12 9v6" />
  </svg>
);

const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconPill = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 20.5L3.5 13.5a5 5 0 017-7l7 7a5 5 0 01-7 7z" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const IconFlask = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6M9 3v8l-4 9h14l-4-9V3" />
  </svg>
);

const IconSyringe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M2 12h20" />
  </svg>
);

const IconClip = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
  </svg>
);

export default function ConsultaForm({ onSave }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const patientSearchRef = useRef(null);

  const [activeStep, setActiveStep] = useState(0);
  const [consultaId] = useState(genId);

  const [patientId, setPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientResults, setShowPatientResults] = useState(false);

  const [date, setDate] = useState(today);
  const [time, setTime] = useState(currentTime);
  const [doctor, setDoctor] = useState("");
  const [status, setStatus] = useState("open");
  const [severity, setSeverity] = useState("med");
  const [visitTypes, setVisitTypes] = useState([]);
  const [availableVisitTypes, setAvailableVisitTypes] = useState([]);
  const [loadingVisitTypes, setLoadingVisitTypes] = useState(true);

  const [weight, setWeight] = useState("");
  const [temp, setTemp] = useState("");
  const [hr, setHr] = useState("");
  const [rr, setRr] = useState("");
  const [bp, setBp] = useState("");
  const [spo2, setSpo2] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [observations, setObservations] = useState("");
  const [nextAppt, setNextAppt] = useState("");
  const [followReason, setFollowReason] = useState("");

  const [pregMonths, setPregMonths] = useState("");
  const [pregBabies, setPregBabies] = useState("");
  const [pregRisk, setPregRisk] = useState("bajo");
  const [pregDeliveryType, setPregDeliveryType] = useState("");
  const [pregDueDate, setPregDueDate] = useState("");
  const [pregNotes, setPregNotes] = useState("");

  const [meds, setMeds] = useState([]);
  const [medNotes, setMedNotes] = useState("");
  const [analytics, setAnalytics] = useState([]);
  const [analyticsNotes, setAnalyticsNotes] = useState("");
  const [vaccines, setVaccines] = useState([]);
  const [vacBatch, setVacBatch] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [mascotas, setMascotas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [doctores, setDoctores] = useState([]);

  const [loadingMascotas, setLoadingMascotas] = useState(true);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingDoctores, setLoadingDoctores] = useState(true);
  const [saving, setSaving] = useState(false);

  const getTodayDate = () => today();
  const getNowTime = () => currentTime();
  const isPregnancyVisit = visitTypes.includes("emb");

  const datePickerValue = useMemo(() => {
    return date ? buildDateTime(date, "00:00") : new Date();
  }, [date]);

  const timePickerValue = useMemo(() => {
    return buildDateTime(date || getTodayDate(), time || getNowTime());
  }, [date, time]);

  const vitalRules = {
    weight: {
      formatter: "decimalNumber",
      validate: [
        {
          test: validators.maxLength(5),
          message: "El peso no puede exceder 5 caracteres.",
        },
      ],
    },
    temp: {
      validate: [
        {
          test: validators.maxLength(5),
          message: "La temperatura no puede exceder 5 caracteres.",
        },
      ],
    },
    hr: {
      formatter: "onlyNumbers",
      validate: [
        {
          test: validators.maxLength(3),
          message: "La frecuencia cardíaca no puede exceder 3 dígitos.",
        },
      ],
    },
    rr: {
      formatter: "onlyNumbers",
      validate: [
        {
          test: validators.maxLength(3),
          message: "La frecuencia respiratoria no puede exceder 3 dígitos.",
        },
      ],
    },
    bp: {
      formatter: "bloodPressure",
      validate: [
        {
          test: validators.maxLength(7),
          message: "La presión arterial no puede exceder el formato 000/000.",
        },
      ],
    },
    spo2: {
      formatter: "onlyNumbers",
      validate: [
        {
          test: validators.maxLength(3),
          message: "La saturación O₂ no puede exceder 3 dígitos.",
        },
      ],
    },
  };

  const vitalSetters = {
    weight: setWeight,
    temp: setTemp,
    hr: setHr,
    rr: setRr,
    bp: setBp,
    spo2: setSpo2,
  };

  const formatTemperatureAuto = (value) => {
    const digits = String(value).replace(/\D/g, "").slice(0, 4);

    if (digits.length === 0) return "";
    if (digits.length <= 2) return digits;
    if (digits.length === 3) return `${digits.slice(0, 2)}.${digits.slice(2)}`;

    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}`;
  };

  const handleVitalChange = (name, value) => {
    let formattedValue = applyFieldFormatting(name, value, vitalRules);

    if (name === "temp") {
      formattedValue = formatTemperatureAuto(value);
    }

    if (name === "weight") {
      const [int = "", dec] = formattedValue.split(".");
      const safeInt = int.slice(0, 4);
      formattedValue =
        dec !== undefined ? `${safeInt}.${dec.slice(0, 2)}` : safeInt;
    }

    if (name === "hr" || name === "rr" || name === "spo2") {
      formattedValue = formattedValue.slice(0, 3);
    }

    if (name === "bp") {
      formattedValue = formattedValue.slice(0, 7);
    }

    vitalSetters[name](formattedValue);

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleDateChange = (selectedDate) => {
    if (!selectedDate) return;

    const liveToday = getTodayDate();
    const liveNow = getNowTime();
    const pickedDate = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;

    if (pickedDate !== liveToday) {
      setDate(liveToday);
      setTime(liveNow);
      return;
    }

    setDate(pickedDate);

    if (!time || time < liveNow) {
      setTime(liveNow);
    }
  };

  const handleTimeChange = (selectedTime) => {
    if (!selectedTime) return;

    const pickedTime = `${String(selectedTime.getHours()).padStart(2, "0")}:${String(
      selectedTime.getMinutes()
    ).padStart(2, "0")}`;

    const liveToday = getTodayDate();
    const liveNow = getNowTime();

    if (date === liveToday && pickedTime < liveNow) {
      setTime(liveNow);
      return;
    }

    setTime(pickedTime);
  };

  useEffect(() => {
    const syncLiveTime = () => {
      const liveToday = getTodayDate();
      const liveNow = getNowTime();

      if (date === liveToday && (!time || time < liveNow)) {
        setTime(liveNow);
      }
    };

    syncLiveTime();

    const interval = setInterval(syncLiveTime, 30000);
    return () => clearInterval(interval);
  }, [date, time]);

  useEffect(() => {
    const loadMascotas = async () => {

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const res = await fetch(`${API_URL}/api/mascotas`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const data = await res.json();

        const normalizedMascotas = Array.isArray(data)
          ? data.map((mascota) => ({
              id:
                mascota.id ??
                mascota.Id ??
                mascota.ID ??
                mascota.mascotaId ??
                mascota.MascotaId ??
                mascota._id ??
                "",
              clienteId:
                mascota.clienteId ??
                mascota.ClienteId ??
                mascota.cliente_id ??
                mascota.idCliente ??
                mascota.IdCliente ??
                mascota.ownerId ??
                "",
              nombre: mascota.nombre ?? mascota.Nombre ?? "",
              raza: mascota.raza ?? mascota.Raza ?? "",
              edad: mascota.edad ?? mascota.Edad ?? "",
              sexo: mascota.sexo ?? mascota.Sexo ?? "",
              peso: mascota.peso ?? mascota.Peso ?? "",
            }))
          : [];

        setMascotas(normalizedMascotas);
      } catch (error) {
        console.error("Error loading mascotas:", error);
        setMascotas([]);
      } finally {
        setLoadingMascotas(false);
      }
    };

    loadMascotas();
  }, [navigate]);

  useEffect(() => {
    const loadClientes = async () => {


      try {
        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const res = await fetch(`${API_URL}/api/clientes`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const data = await res.json();

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
              telefono:
                cliente.telefono ??
                cliente.Telefono ??
                cliente.tel ??
                "",
            }))
          : [];

        setClientes(normalizedClientes);
      } catch (error) {
        console.error("Error loading clientes:", error);
        setClientes([]);
      } finally {
        setLoadingClientes(false);
      }
    };

    loadClientes();
  }, [navigate]);

  useEffect(() => {
    const loadDoctores = async () => {


      try {
        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const res = await fetch(`${API_URL}/api/doctores`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const data = await res.json();

        const normalizedDoctores = Array.isArray(data)
          ? data.map((doctor) => ({
              id:
                doctor.id ??
                doctor.Id ??
                doctor.doctorId ??
                doctor.DoctorId ??
                doctor._id ??
                "",
              nombre:
                doctor.nombre ??
                doctor.Nombre ??
                doctor.name ??
                doctor.Name ??
                String(doctor),
            }))
          : [];

        setDoctores(normalizedDoctores);
      } catch (error) {
        console.error("Error loading doctores:", error);
        setDoctores([]);
      } finally {
        setLoadingDoctores(false);
      }
    };

    loadDoctores();
  }, [navigate]);

  useEffect(() => {
    const loadTiposConsulta = async () => {

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const res = await fetch(`${API_URL}/api/tipos-consulta`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/", { replace: true });
          return;
        }

        const data = await res.json();

        const normalizedTipos = Array.isArray(data)
          ? data.map((tipo) => ({
              id: tipo.id ?? "",
              codigo: tipo.codigo ?? "",
              nombre: tipo.nombre ?? "",
              colorClass: getVisitTypeColorClass(tipo.codigo),
            }))
          : [];

        setAvailableVisitTypes(normalizedTipos);
      } catch (error) {
        console.error("Error loading tipos de consulta:", error);
        setAvailableVisitTypes([]);
      } finally {
        setLoadingVisitTypes(false);
      }
    };

    loadTiposConsulta();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(event.target)) {
        setShowPatientResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mascotasConDueno = useMemo(() => {
    return mascotas.map((mascota) => {
      const cliente = clientes.find(
        (cliente) => String(cliente.id) === String(mascota.clienteId)
      );

      return {
        ...mascota,
        clienteNombre: cliente?.nombre || "Dueño desconocido",
        clienteTelefono: cliente?.telefono || "",
      };
    });
  }, [mascotas, clientes]);

  const filteredMascotas = useMemo(() => {
    const search = patientSearch.trim().toLowerCase();

    if (!search) return mascotasConDueno;

    return mascotasConDueno.filter((mascota) => {
      const nombre = mascota.nombre?.toLowerCase() || "";
      const raza = mascota.raza?.toLowerCase() || "";
      const clienteNombre = mascota.clienteNombre?.toLowerCase() || "";
      const clienteTelefono = String(mascota.clienteTelefono || "").toLowerCase();

      return (
        nombre.includes(search) ||
        raza.includes(search) ||
        clienteNombre.includes(search) ||
        clienteTelefono.includes(search)
      );
    });
  }, [mascotasConDueno, patientSearch]);

  const selectedPatient = useMemo(() => {
    return mascotasConDueno.find(
      (mascota) => String(mascota.id) === String(patientId)
    );
  }, [mascotasConDueno, patientId]);

  const handleSelectPatient = (mascota) => {
    setPatientId(mascota.id);
    setPatientSearch(
      `${mascota.nombre}${mascota.raza ? ` — ${mascota.raza}` : ""}${
        mascota.clienteNombre ? ` — ${mascota.clienteNombre}` : ""
      }${mascota.clienteTelefono ? ` — ${mascota.clienteTelefono}` : ""}`
    );
    setShowPatientResults(false);
  };

  const toggleType = (codigo) => {
    setVisitTypes((prev) =>
      prev.includes(codigo) ? prev.filter((t) => t !== codigo) : [...prev, codigo]
    );
  };

  const addTag = (setter) => (val) => setter((prev) => [...prev, val]);
  const removeTag = (setter) => (index) =>
    setter((prev) => prev.filter((_, i) => i !== index));

  const handleFilesSelected = (filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    setAttachedFiles((prev) => {
      const existingKeys = new Set(
        prev.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
      );

      const newUniqueFiles = files.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        return !existingKeys.has(key);
      });

      return [...prev, ...newUniqueFiles];
    });
  };

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const mapStatusToDb = (value) => {
    const map = {
      open: "abierta",
      follow: "seguimiento",
      closed: "cerrada",
    };
    return map[value] || value;
  };

  const mapSeverityToDb = (value) => {
    const map = {
      low: "leve",
      med: "moderada",
      high: "alta",
      crit: "critica",
    };
    return map[value] || value;
  };

  const showStepError = (text) => {
    Swal.fire({
      title: "Error",
      text,
      icon: "error",
      position: "center",
      timer: 3500,
      showConfirmButton: true,
    });
  };

  const validateStep = (step) => {
    const vitalValues = { weight, temp, hr, rr, bp, spo2 };
    const vitalErrors = validateFields(vitalValues, vitalRules);

    if (step === 0) {
      const liveToday = getTodayDate();
      const liveNow = getNowTime();

      if (!patientId) {
        showStepError("Debes seleccionar una mascota.");
        return false;
      }

      if (!doctor) {
        showStepError("Debes seleccionar un doctor.");
        return false;
      }

      if (!date || date !== liveToday) {
        showStepError("La consulta solo puede registrarse con la fecha actual.");
        return false;
      }

      if (!time || (date === liveToday && time < liveNow)) {
        setTime(liveNow);
        showStepError("La hora se actualizó automáticamente a la hora actual.");
        return false;
      }

      return true;
    }

    if (step === 1) {
      if (visitTypes.length === 0) {
        showStepError("Debes seleccionar al menos un tipo de consulta.");
        return false;
      }

      if (Object.keys(vitalErrors).length > 0) {
        setFieldErrors(vitalErrors);
        showStepError("Corrige los campos de signos vitales.");
        return false;
      }

      if (isPregnancyVisit) {
        if (!pregMonths.trim()) {
          showStepError("Debes indicar los meses de gestación.");
          return false;
        }

        if (!pregBabies.trim()) {
          showStepError("Debes indicar cuántas crías son.");
          return false;
        }

        if (!pregDeliveryType) {
          showStepError("Debes seleccionar el tipo de parto.");
          return false;
        }
      }

      return true;
    }

    if (step === 2) {
      if (!reason.trim()) {
        setFieldErrors((prev) => ({ ...prev, reason: "Este campo es obligatorio." }));
        showStepError("Debes escribir el motivo de consulta.");
        return false;
      }

      if (!diagnosis.trim()) {
        setFieldErrors((prev) => ({ ...prev, diagnosis: "Este campo es obligatorio." }));
        showStepError("Debes escribir el diagnóstico.");
        return false;
      }

      if (status === "follow") {
        if (!nextAppt) {
          showStepError("Debes indicar la próxima cita para una consulta de seguimiento.");
          return false;
        }

        if (!followReason.trim()) {
          showStepError("Debes indicar el motivo de seguimiento.");
          return false;
        }
      }

      return true;
    }

    if (step === 3) {
      if (visitTypes.includes("vac") && vaccines.length === 0) {
        showStepError("Si seleccionas tipo Vacuna, debes agregar al menos una vacuna aplicada.");
        return false;
      }

      if (visitTypes.includes("med") && meds.length === 0) {
        showStepError("Si seleccionas tipo Medicación, debes agregar al menos un medicamento.");
        return false;
      }

      return true;
    }

    return true;
  };

  const goToStep = (nextStep) => {
    if (nextStep <= activeStep) {
      setActiveStep(nextStep);
      return;
    }

    for (let i = 0; i < nextStep; i++) {
      if (!validateStep(i)) return;
    }

    setActiveStep(nextStep);
  };

  const handleNext = () => {
    if (!validateStep(activeStep)) return;
    setActiveStep((prev) => Math.min(prev + 1, STEP_TABS.length - 1));
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSave = async () => {


    for (let i = 0; i < STEP_TABS.length; i++) {
      if (!validateStep(i)) {
        setActiveStep(i);
        return;
      }
    }

    try {
      setSaving(true);

      if (onSave) {
        await onSave({
          consulta_codigo: consultaId,
          pet_id: patientId,
          client_id: selectedPatient?.clienteId || null,
          doctor_id: doctor,
          fecha: date,
          hora: time,
          motivo: reason,
          diagnostico: diagnosis,
          observaciones: observations,
          estado: mapStatusToDb(status),
          gravedad: mapSeverityToDb(severity),
          tipos_consulta: visitTypes,
          proxima_cita: nextAppt || null,
          motivo_seguimiento: followReason || null,
          embarazo: isPregnancyVisit
            ? {
                meses_gestacion: pregMonths,
                cantidad_crias: pregBabies,
                riesgo: pregRisk,
                tipo_parto: pregDeliveryType,
                fecha_probable_parto: pregDueDate || null,
                observaciones_embarazo: pregNotes || null,
              }
            : null,
          vitals: { weight, temp, hr, rr, bp, spo2 },
          medicaciones: meds,
          notas_medicacion: medNotes,
          analisis: analytics,
          notas_analisis: analyticsNotes,
          vacunas: vaccines,
          lote_vacuna: vacBatch,
          patient: selectedPatient || null,
          attachedFiles,
        });

        Swal.fire({
          title: "Guardado",
          text: "Consulta guardada correctamente.",
          icon: "success",
          timer: 3000,
          showConfirmButton: false,
          position: "center",
        });
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const formData = new FormData();

      formData.append("consulta_codigo", consultaId);
      formData.append("pet_id", patientId);
      formData.append("client_id", selectedPatient?.clienteId || "");
      formData.append("doctor_id", doctor);
      formData.append("fecha", date);
      formData.append("hora", time);
      formData.append("motivo", reason);
      formData.append("diagnostico", diagnosis);
      formData.append("observaciones", observations);
      formData.append("estado", mapStatusToDb(status));
      formData.append("gravedad", mapSeverityToDb(severity));
      formData.append("proxima_cita", nextAppt || "");
      formData.append("motivo_seguimiento", followReason || "");

      formData.append("meses_gestacion", isPregnancyVisit ? pregMonths : "");
      formData.append("cantidad_crias", isPregnancyVisit ? pregBabies : "");
      formData.append("riesgo_embarazo", isPregnancyVisit ? pregRisk : "");
      formData.append("tipo_parto", isPregnancyVisit ? pregDeliveryType : "");
      formData.append("fecha_probable_parto", isPregnancyVisit ? pregDueDate : "");
      formData.append("observaciones_embarazo", isPregnancyVisit ? pregNotes : "");

      formData.append("weight", weight || "");
      formData.append("temp", temp || "");
      formData.append("hr", hr || "");
      formData.append("rr", rr || "");
      formData.append("bp", bp || "");
      formData.append("spo2", spo2 || "");

      formData.append("notas_medicacion", medNotes || "");
      formData.append("notas_analisis", analyticsNotes || "");
      formData.append("lote_vacuna", vacBatch || "");

      formData.append("tipos_consulta", JSON.stringify(visitTypes));
      formData.append("medicaciones", JSON.stringify(meds));
      formData.append("analisis", JSON.stringify(analytics));
      formData.append("vacunas", JSON.stringify(vaccines));

      attachedFiles.forEach((file) => {
        formData.append("adjuntos", file);
      });

      const res = await fetch(`${API_URL}/api/consultas`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/", { replace: true });
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Error al guardar la consulta");
      }

      Swal.fire({
        title: "Guardado",
        text: "Consulta guardada correctamente.",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
        position: "center",
      });

      navigate(-1);
    } catch (error) {
      console.error("Error saving consulta:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "No se pudo guardar la consulta.",
        icon: "error",
        timer: 4000,
        showConfirmButton: true,
        position: "center",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.shell}>
        <div className={styles.hero}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate(-1)}
            aria-label="Volver"
          >
            ←
          </button>

          <div className={styles.heroMid}>
            <h1>Nueva consulta</h1>
            <p>Expediente clínico</p>
          </div>

          <div className={styles.heroId}>
            <strong>{consultaId}</strong>
            <span>ID generado automáticamente</span>
          </div>
        </div>

        <div className={styles.progress}>
          {STEP_TABS.map((step) => (
            <div
              key={step.id}
              className={`${styles.progSeg} ${activeStep >= step.id ? styles.done : ""}`}
            />
          ))}
        </div>

        <div className={styles.tabs} role="tablist">
          {STEP_TABS.map((step) => (
            <button
              key={step.id}
              type="button"
              className={`${styles.tab} ${activeStep === step.id ? styles.active : ""}`}
              onClick={() => goToStep(step.id)}
            >
              {step.label}
            </button>
          ))}
        </div>

        {activeStep === 0 && (
          <div className={styles.panel}>
            <SectionCard icon={<IconUser />} title="Identificación" className={styles.full}>
              <div className={`${styles.bodyGrid} ${styles.cols3}`}>
                <Field label="Paciente (mascota)" full required>
                  <div className={styles.patientSearchWrap} ref={patientSearchRef}>
                    <input
                      type="text"
                      placeholder="Buscar por nombre, raza, tutor o teléfono..."
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        setShowPatientResults(true);
                        setPatientId("");
                      }}
                      onFocus={() => setShowPatientResults(true)}
                    />

                    {showPatientResults && (
                      <div className={styles.patientResults}>
                        {loadingMascotas || loadingClientes ? (
                          <div className={styles.patientResultItem}>Cargando mascotas...</div>
                        ) : filteredMascotas.length === 0 ? (
                          <div className={styles.patientResultItem}>No hay resultados</div>
                        ) : (
                          filteredMascotas.map((mascota) => (
                            <button
                              key={mascota.id}
                              type="button"
                              className={styles.patientResultBtn}
                              onClick={() => handleSelectPatient(mascota)}
                            >
                              <div className={styles.patientResultName}>
                                {mascota.nombre}
                                {mascota.raza ? ` — ${mascota.raza}` : ""}
                              </div>
                              <div className={styles.patientResultSub}>
                                {mascota.clienteNombre || "Dueño desconocido"}
                                {mascota.clienteTelefono ? ` — ${mascota.clienteTelefono}` : ""}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {selectedPatient && (
                    <div className={styles.patientPreview}>
                      <div className={styles.pAvatar}>{initials(selectedPatient.nombre)}</div>
                      <div>
                        <div className={styles.pName}>
                          {selectedPatient.nombre}
                          {selectedPatient.raza ? ` — ${selectedPatient.raza}` : ""}
                        </div>
                        <div className={styles.pSub}>
                          Tutor/a: {selectedPatient.clienteNombre}
                          {selectedPatient.clienteTelefono ? ` · ${selectedPatient.clienteTelefono}` : ""}
                        </div>
                      </div>
                    </div>
                  )}
                </Field>

                <Field label="Fecha" required>
                  <DatePicker
                    selected={datePickerValue}
                    onChange={handleDateChange}
                    dateFormat="MM/dd/yyyy"
                    minDate={new Date()}
                    maxDate={new Date()}
                    className={styles.datePickerInput}
                  />
                </Field>

                <Field label="Hora" required>
                  <DatePicker
                    selected={timePickerValue}
                    onChange={handleTimeChange}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={1}
                    timeCaption="Hora"
                    dateFormat="h:mm aa"
                    className={styles.datePickerInput}
                  />
                </Field>

                <Field label="Doctor / Veterinario" required>
                  <select value={doctor} onChange={(e) => setDoctor(e.target.value)}>
                    <option value="">
                      {loadingDoctores ? "Cargando doctores..." : "— Seleccionar —"}
                    </option>
                    {doctores.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.nombre}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Estado de la consulta" required>
                  <div className={styles.chipGroup}>
                    {STATUS_OPTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`${styles.chip} ${status === s.id ? s.colorClass : ""}`}
                        onClick={() => setStatus(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Gravedad" required>
                  <div className={styles.chipGroup}>
                    {SEVERITY_OPTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`${styles.chip} ${severity === s.id ? s.colorClass : ""}`}
                        onClick={() => setSeverity(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </SectionCard>

            <div className={styles.footer}>
              <button type="button" className={styles.btnCancel} onClick={() => navigate(-1)}>
                Cancelar
              </button>
              <button type="button" className={styles.btnSave} onClick={handleNext}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {activeStep === 1 && (
          <div className={styles.panel}>
            <SectionCard icon={<IconPlus />} title="Tipo y vitales" className={styles.full}>
              <p className={styles.sectionLabel}>Tipo de consulta</p>
              <div className={styles.chipGroup}>
                {loadingVisitTypes ? (
                  <div>Cargando tipos de consulta...</div>
                ) : availableVisitTypes.length === 0 ? (
                  <div>No hay tipos de consulta disponibles.</div>
                ) : (
                  availableVisitTypes.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`${styles.chip} ${
                        visitTypes.includes(t.codigo)
                          ? `${styles.selBlue} ${t.colorClass || ""}`
                          : ""
                      }`}
                      onClick={() => toggleType(t.codigo)}
                    >
                      {t.nombre}
                    </button>
                  ))
                )}
              </div>

              <div className={styles.divider} />

              <p className={styles.sectionLabel}>Signos vitales</p>
              <div className={styles.vitalsGrid}>
                <div className={styles.vitalCard}>
                  <label>Peso</label>
                  <input
                    type="text"
                    placeholder="0.0"
                    value={weight}
                    onChange={(e) => handleVitalChange("weight", e.target.value)}
                    onBlur={(e) => {
                      const nextValue = finalizeDecimal(e.target.value);
                      setWeight(nextValue);
                    }}
                  />
                  <div className={styles.vitalUnit}>kg</div>
                  {fieldErrors.weight && <small className={styles.errorText}>{fieldErrors.weight}</small>}
                </div>

                <div className={styles.vitalCard}>
                  <label>Temperatura</label>
                  <input
                    type="text"
                    placeholder="38.5"
                    value={temp}
                    onChange={(e) => handleVitalChange("temp", e.target.value)}
                    onBlur={(e) => {
                      const nextValue = finalizeDecimal(e.target.value);
                      setTemp(nextValue);
                    }}
                  />
                  <div className={styles.vitalUnit}>°C</div>
                  {fieldErrors.temp && <small className={styles.errorText}>{fieldErrors.temp}</small>}
                </div>

                <div className={styles.vitalCard}>
                  <label>Frec. cardíaca</label>
                  <input
                    type="text"
                    placeholder="80"
                    value={hr}
                    onChange={(e) => handleVitalChange("hr", e.target.value)}
                  />
                  <div className={styles.vitalUnit}>bpm</div>
                  {fieldErrors.hr && <small className={styles.errorText}>{fieldErrors.hr}</small>}
                </div>

                <div className={styles.vitalCard}>
                  <label>Frec. respiratoria</label>
                  <input
                    type="text"
                    placeholder="20"
                    value={rr}
                    onChange={(e) => handleVitalChange("rr", e.target.value)}
                  />
                  <div className={styles.vitalUnit}>rpm</div>
                  {fieldErrors.rr && <small className={styles.errorText}>{fieldErrors.rr}</small>}
                </div>

                <div className={styles.vitalCard}>
                  <label>Presión arterial</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={bp}
                    onChange={(e) => handleVitalChange("bp", e.target.value)}
                  />
                  <div className={styles.vitalUnit}>mmHg</div>
                  {fieldErrors.bp && <small className={styles.errorText}>{fieldErrors.bp}</small>}
                </div>

                <div className={styles.vitalCard}>
                  <label>Saturación O₂</label>
                  <input
                    type="text"
                    placeholder="98"
                    value={spo2}
                    onChange={(e) => handleVitalChange("spo2", e.target.value)}
                  />
                  <div className={styles.vitalUnit}>%</div>
                  {fieldErrors.spo2 && <small className={styles.errorText}>{fieldErrors.spo2}</small>}
                </div>
              </div>

              {isPregnancyVisit && (
                <>
                  <div className={styles.divider} />
                  <p className={styles.sectionLabel}>Control de embarazo</p>

                  <div className={styles.row2}>
                    <Field label="Meses de gestación" required>
                      <input
                        type="text"
                        value={pregMonths}
                        onChange={(e) => setPregMonths(e.target.value)}
                      />
                    </Field>

                    <Field label="Cantidad de crías" required>
                      <input
                        type="text"
                        value={pregBabies}
                        onChange={(e) => setPregBabies(e.target.value)}
                      />
                    </Field>

                    <Field label="Riesgo del embarazo" required>
                      <select value={pregRisk} onChange={(e) => setPregRisk(e.target.value)}>
                        <option value="bajo">Bajo</option>
                        <option value="alto">Alto</option>
                      </select>
                    </Field>

                    <Field label="Tipo de parto" required>
                      <select
                        value={pregDeliveryType}
                        onChange={(e) => setPregDeliveryType(e.target.value)}
                      >
                        <option value="">— Seleccionar —</option>
                        <option value="normal">Normal</option>
                        <option value="cesarea">Cesárea</option>
                      </select>
                    </Field>

                    <Field label="Fecha probable de parto">
                      <input
                        type="date"
                        value={pregDueDate}
                        onChange={(e) => setPregDueDate(e.target.value)}
                      />
                    </Field>

                    <Field label="Observaciones del embarazo" full>
                      <textarea value={pregNotes} onChange={(e) => setPregNotes(e.target.value)} />
                    </Field>
                  </div>
                </>
              )}
            </SectionCard>

            <div className={styles.footer}>
              <button type="button" className={styles.btnCancel} onClick={handlePrev}>
                ← Anterior
              </button>
              <button type="button" className={styles.btnSave} onClick={handleNext}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className={styles.panel}>
            <SectionCard icon={<IconFile />} title="Diagnóstico" className={styles.full}>
              <Field label="Motivo de consulta" full required>
                <textarea
                  placeholder="Describe el motivo de la visita…"
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, reason: "" }));
                  }}
                />
                {fieldErrors.reason && <small className={styles.errorText}>{fieldErrors.reason}</small>}
              </Field>

              <Field label="Diagnóstico" full required>
                <textarea
                  placeholder="Diagnóstico del veterinario…"
                  value={diagnosis}
                  onChange={(e) => {
                    setDiagnosis(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, diagnosis: "" }));
                  }}
                />
                {fieldErrors.diagnosis && (
                  <small className={styles.errorText}>{fieldErrors.diagnosis}</small>
                )}
              </Field>

              <Field label="Observaciones" full>
                <textarea
                  placeholder="Comportamiento, notas adicionales…"
                  style={{ minHeight: 56 }}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </Field>

              <div className={styles.row2}>
                <Field label="Próxima cita">
                  <input
                    type="date"
                    value={nextAppt}
                    onChange={(e) => setNextAppt(e.target.value)}
                  />
                </Field>

                <Field label="Motivo de seguimiento">
                  <input
                    type="text"
                    placeholder="Ej: revisión post-cirugía"
                    value={followReason}
                    onChange={(e) => setFollowReason(e.target.value)}
                  />
                </Field>
              </div>
            </SectionCard>

            <div className={styles.footer}>
              <button type="button" className={styles.btnCancel} onClick={handlePrev}>
                ← Anterior
              </button>
              <button type="button" className={styles.btnSave} onClick={handleNext}>
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className={styles.panel}>
            <div className={styles.row2}>
              <div>
                <SectionCard icon={<IconPill />} title="Medicación">
                  <TagInput
                    tags={meds}
                    onAdd={addTag(setMeds)}
                    onRemove={removeTag(setMeds)}
                    placeholder="Ej: Amoxicilina 500mg"
                  />
                  <Field label="Indicaciones / dosis">
                    <textarea
                      placeholder="Ej: 1 tableta cada 12h por 7 días…"
                      value={medNotes}
                      onChange={(e) => setMedNotes(e.target.value)}
                      style={{ minHeight: 56 }}
                    />
                  </Field>
                </SectionCard>
              </div>

              <div>
                <SectionCard icon={<IconFlask />} title="Análisis realizados">
                  <TagInput
                    tags={analytics}
                    onAdd={addTag(setAnalytics)}
                    onRemove={removeTag(setAnalytics)}
                    placeholder="Ej: Hemograma completo"
                  />
                  <Field label="Resultados / observaciones">
                    <textarea
                      placeholder="Resumen de resultados de laboratorio…"
                      value={analyticsNotes}
                      onChange={(e) => setAnalyticsNotes(e.target.value)}
                      style={{ minHeight: 56 }}
                    />
                  </Field>
                </SectionCard>
              </div>
            </div>

            <div className={styles.divider} />

            <SectionCard icon={<IconSyringe />} title="Vacunas aplicadas" className={styles.full}>
              <TagInput
                tags={vaccines}
                onAdd={addTag(setVaccines)}
                onRemove={removeTag(setVaccines)}
                placeholder="Ej: Rabia, Parvovirus"
              />
              <Field label="Lote / observaciones">
                <input
                  type="text"
                  placeholder="Número de lote o notas…"
                  value={vacBatch}
                  onChange={(e) => setVacBatch(e.target.value)}
                />
              </Field>
            </SectionCard>

            <SectionCard icon={<IconClip />} title="Archivos adjuntos" className={styles.full}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              <div
                className={styles.dropZone}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFilesSelected(e.dataTransfer.files);
                }}
              >
                <div className={styles.dropIcon}>📎</div>
                <p>Arrastra archivos o haz clic para subir</p>
                <span>Rayos X, ecografías, resultados de lab…</span>
              </div>

              {attachedFiles.length > 0 && (
                <div className={styles.filesList}>
                  {attachedFiles.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${index}`} className={styles.fileItem}>
                      <div className={styles.fileInfo}>
                        <div className={styles.fileName}>{file.name}</div>
                        <div className={styles.fileMeta}>{(file.size / 1024).toFixed(1)} KB</div>
                      </div>

                      <button
                        type="button"
                        className={styles.btnOutline}
                        onClick={() => removeFile(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <div className={styles.footer}>
              <button type="button" className={styles.btnCancel} onClick={handlePrev} disabled={saving}>
                ← Anterior
              </button>

              <button
                type="button"
                className={styles.btnCancel}
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={styles.btnSave}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar consulta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
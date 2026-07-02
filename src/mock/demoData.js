export const demoUser = {
  id: "demo-admin",
  username: "demo@vetcare.com",
  role: "ADMIN",
};

export const demoClientes = [
  {
    id: "1",
    nombre: "Lucero Fernández",
    cedula: "00112345678",
    telefono: "8095551234",
    correo: "lucero@email.com",
    direccion: "Santo Domingo",
    estado: "activo",
  },
];

export const demoMascotas = [
  {
    id: "m1",
    clienteId: "1",
    name: "Loki",
    nombre: "Loki",
    breed: "Pastor Alemán",
    raza: "Pastor Alemán",
    age_years: 3,
    edad: 3,
    first_name: "Adrian",
    last_name: "Salazar",
    clienteNombre: "Adrian Salazar",
    consultasTotal: 3,
    ultimaConsulta: "2026-04-13",
  },

  {
    id: "m1",
    name: "Cian",
    nombre: "Cian",
    breed: "Mestiza",
    raza: "Gato",
    age_years: 3,
    edad: 3,
    first_name: "Lucero",
    last_name: "Fernandez",
    clienteNombre: "Lucero Fernandez",
    consultasTotal: 3,
    ultimaConsulta: "2026-04-13",
  },
];

export const demoAlertas = [
  {
    id: "1",
    mascota_nombre: "Loki",
    cliente_nombre: "Lucero Fernández",
    cliente_telefono: "8095551234",
    doctor_nombre: "Dr. Juan Pérez",
    fecha: "2026-04-13",
    proxima_cita: "2026-04-14",
    motivo: "Chequeo general",
    categoria: "manana",
    gravedad: "moderada",
    estado: "seguimiento",
  },
];

export const demoRegistro = {
  clientes: [
    {
      id: "1",
      nombre: "Adrian Salazar",
      cedula: "1525358522",
      direccion: "Santo Domingo",
      correo: "adrian@email.com",
      telefono: "8585685258",
      telefono2: "",
      estado: "activo",
    },
    {
      id: "2",
      nombre: "Adriana Hernández",
      cedula: "4525852885",
      direccion: "Santiago",
      correo: "adriana@email.com",
      telefono: "5253310568",
      telefono2: "",
      estado: "activo",
    },
  ],
  mascotas: [
    {
      id: "m1",
      clienteId: "1",
      nombre: "Loki",
      edad: 3,
      raza: "Pastor Alemán",
      sexo: "MALE",
      peso: 28,
      observaciones: "Paciente saludable",
      estado: "activo",
    },
    {
      id: "m2",
      clienteId: "2",
      nombre: "Sachi",
      edad: 2,
      raza: "Mestiza",
      sexo: "FEMALE",
      peso: 12,
      observaciones: "Vacunas al día",
      estado: "activo",
    },
  ],
};

export const demoStats = [
  { label: "Clientes", value: "24", accent: "#2a9d8f" },
  { label: "Mascotas", value: "37", accent: "#e76f51" },
  { label: "Consultas", value: "18", accent: "#457b9d" },
  { label: "Alertas", value: "4", accent: "#8e44ad" },
];


export const demoConsultaDetalle = {
  id: "c1",
  doctor_id: "d1",
  pet_id: "m1",
  client_id: "1",

  visit_at: "2026-04-13T10:30:00",
  reason: "Chequeo general y vacunación anual",
  diagnosis:
    "Paciente clínicamente estable. No se observan signos de enfermedad activa.",
  notes:
    "Buena condición corporal. Se recomienda mantener control antiparasitario y volver en 6 meses.",

  estado: "abierta",
  gravedad: "moderada",
  proxima_cita: "2026-10-13T09:00:00",
  motivo_seguimiento: "Control preventivo semestral",

  doctor: "Dr. Juan Pérez",

  tipos_consulta: ["general", "vacuna"],
  tipos_consulta_detalle: [
    { id: "t1", codigo: "general", nombre: "Consulta general" },
    { id: "t2", codigo: "vacuna", nombre: "Vacunación" },
  ],

  treatment: "Simparica, Vacuna múltiple anual",

  medicaciones: [
    {
      medicamento: "Simparica",
      indicaciones: "1 tableta vía oral, repetir mensualmente.",
    },
  ],

  analisis: [
    {
      analisis: "Hemograma",
      resultado_observacion: "Valores dentro de rango normal.",
    },
  ],

  vacunas: [
    {
      vacuna: "Vacuna múltiple anual",
      lote_observaciones: "Lote VAC-2026-001",
    },
  ],

  adjuntos: [],
};

export const demoHistorialMascota = [
  {
    id: "c1",
    visit_at: "2026-04-13T10:30:00",
    reason: "Chequeo general y vacunación anual",
    doctor: "Dr. Juan Pérez",
    tipos_consulta: ["gen", "vac"],
    tipos_consulta_detalle: [
      { codigo: "gen", nombre: "Examen general" },
      { codigo: "vac", nombre: "Vacuna" },
    ],
  },
  {
    id: "c2",
    visit_at: "2026-03-02T09:15:00",
    reason: "Control rutinario",
    doctor: "Dra. María López",
    tipos_consulta: ["rou"],
    tipos_consulta_detalle: [
      { codigo: "rou", nombre: "Control rutinario" },
    ],
  },
];
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
    id: "1",
    clienteId: "1",
    nombre: "Loki",
    raza: "Golden Retriever",
    edad: 3,
    sexo: "MALE",
    peso: 28,
    observaciones: "Paciente saludable",
    estado: "activo",
  },
];
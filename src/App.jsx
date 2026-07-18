import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Menu from "./pages/Menu.jsx";
import Clientes from "./pages/Clientes.jsx";
import Mascotas from "./pages/Mascotas.jsx";
import Registro from "./pages/Registro.jsx";
import Register from "./pages/register.jsx";
import Alertas from "./pages/Alertas.jsx";
import Consultas from "./pages/Consultas.jsx";
import Historial from "./pages/Historial.jsx";
import HistorialMascota from "./pages/HistorialMascota.jsx";
import ConsultaDetalle from "./pages/ConsultaDetalle.jsx";
import RegistroCliente from "./pages/RegistroCliente.jsx";
import Agenda from "./pages/Agenda.jsx";
import MiAgenda from "./pages/MiAgenda.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import RequireRole from "./auth/RequireRole.jsx";

import ClientLayout from "./pages/portal/ClientLayout.jsx";
import Inicio from "./pages/portal/Inicio.jsx";
import MisMascotas from "./pages/portal/MisMascotas.jsx";
import MascotaDetalle from "./pages/portal/MascotaDetalle.jsx";
import Perfil from "./pages/portal/Perfil.jsx";
import MisCitas from "./pages/portal/MisCitas.jsx";
import AgendarCita from "./pages/portal/AgendarCita.jsx";
import CarnetVacunacion from "./pages/portal/CarnetVacunacion.jsx";
import HistorialClinico from "./pages/portal/HistorialClinico.jsx";

const STAFF_ROLES = ["ADMIN", "DOCTOR", "STAFF"];
const CLINICAL_ROLES = ["ADMIN", "DOCTOR"];

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/admin/register"
            element={
              <RequireRole roles={["ADMIN"]}>
                <Register />
              </RequireRole>
            }
          />

          <Route
            path="/menu"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <Menu />
              </RequireRole>
            }
          />
          <Route
            path="/agenda"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <Agenda />
              </RequireRole>
            }
          />
          <Route
            path="/mi-agenda"
            element={
              <RequireRole roles={CLINICAL_ROLES}>
                <MiAgenda />
              </RequireRole>
            }
          />
          <Route
            path="/clientes"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <Clientes />
              </RequireRole>
            }
          />
          <Route
            path="/mascotas"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <Mascotas />
              </RequireRole>
            }
          />
          <Route
            path="/registro"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <Registro />
              </RequireRole>
            }
          />
          <Route
            path="/consultas"
            element={
              <RequireRole roles={CLINICAL_ROLES}>
                <Consultas />
              </RequireRole>
            }
          />
          <Route
            path="/historial"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <Historial />
              </RequireRole>
            }
          />
          <Route
            path="/alertas"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <Alertas />
              </RequireRole>
            }
          />
          <Route
            path="/historial-clinico/:mascotaId"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <HistorialMascota />
              </RequireRole>
            }
          />
          <Route
            path="/consulta/:consultaId"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <ConsultaDetalle />
              </RequireRole>
            }
          />
          <Route
            path="/registro/:clienteId"
            element={
              <RequireRole roles={STAFF_ROLES}>
                <RegistroCliente />
              </RequireRole>
            }
          />

          {/* Client portal — nested under ClientLayout, CLIENT role only */}
          <Route
            element={
              <RequireRole roles={["CLIENT"]}>
                <ClientLayout />
              </RequireRole>
            }
          >
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/mis-mascotas" element={<MisMascotas />} />
            <Route path="/mis-mascotas/:id" element={<MascotaDetalle />} />
            <Route path="/mis-mascotas/:id/carnet" element={<CarnetVacunacion />} />
            <Route path="/mis-mascotas/:id/historial" element={<HistorialClinico />} />
            <Route path="/mis-citas" element={<MisCitas />} />
            <Route path="/agendar-cita" element={<AgendarCita />} />
            <Route path="/mi-perfil" element={<Perfil />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

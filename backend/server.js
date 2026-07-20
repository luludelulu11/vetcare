import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import sgMail from "@sendgrid/mail";
import cron from "node-cron";
import prisma from "./prisma/client.js";

// Prefer IPv4 for outbound connections. Some container hosts (e.g. Railway)
// have no working IPv6 egress, but DNS returns an IPv6 address first for
// smtp.gmail.com — which made nodemailer fail with ENETUNREACH. This makes
// dns.lookup (used by nodemailer's SMTP socket) return IPv4 addresses first.
dns.setDefaultResultOrder("ipv4first");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Running behind Railway's (single) reverse proxy: trust the first hop so
// req.ip reflects the real client IP for express-rate-limit, and the
// X-Forwarded-For validation error goes away. Use a number (not `true`) so
// rate-limit doesn't flag a permissive/spoofable trust-proxy setting.
app.set("trust proxy", 1);

// Comma-separated list of explicitly allowed origins (e.g. a custom domain),
// on top of the Vercel/localhost patterns handled below.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Vercel serves this project under several URLs at once — the production
// alias (vetcare-drab...), the git-branch URL (vetcare-git-main-...), and a
// fresh per-deploy preview URL each build — all sharing the
// "vetcare-*.vercel.app" shape. Allow them all so CORS doesn't break every
// time Vercel mints a new URL. Set ALLOWED_ORIGINS for anything outside this
// (e.g. a custom domain).
const vercelOriginPattern = /^https:\/\/vetcare-[a-z0-9-]+\.vercel\.app$/;

function isAllowedOrigin(origin) {
  if (!origin) return true; // non-browser clients (curl, server-to-server)
  if (origin.startsWith("http://localhost")) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (vercelOriginPattern.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

const uploadsBaseDir = path.join(__dirname, "uploads");
const consultasUploadsDir = path.join(uploadsBaseDir, "consultas");
const avatarsUploadsDir = path.join(uploadsBaseDir, "avatars");

if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}

if (!fs.existsSync(consultasUploadsDir)) {
  fs.mkdirSync(consultasUploadsDir, { recursive: true });
}

if (!fs.existsSync(avatarsUploadsDir)) {
  fs.mkdirSync(avatarsUploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsBaseDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, consultasUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`;
    const safeOriginalName = file.originalname.replace(/[^\w.\-]/g, "_");
    cb(null, `${uniquePrefix}-${safeOriginalName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10,
  },
});

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${crypto.randomUUID()}`;
    const safeOriginalName = file.originalname.replace(/[^\w.\-]/g, "_");
    cb(null, `${uniquePrefix}-${safeOriginalName}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Solo se permiten archivos de imagen."));
    }
    cb(null, true);
  },
});

// SMTP transport. Hosts without IPv6 egress (Railway) fail with ENETUNREACH
// because smtp.gmail.com resolves to an IPv6 address first — and nodemailer
// does its own DNS via dns.resolve() internally, so dns.setDefaultResultOrder
// and `family: 4` don't reliably force IPv4. The robust fix: resolve the host
// to an IPv4 address ourselves and connect to that literal IP, keeping the
// real hostname as the TLS servername for certificate validation.
const MAIL_HOST = process.env.MAIL_HOST || "smtp.gmail.com";

function createMailTransport(connectHost) {
  const usingIp = connectHost !== MAIL_HOST;
  return nodemailer.createTransport({
    host: connectHost,
    port: Number(process.env.MAIL_PORT || 587),
    secure: String(process.env.MAIL_SECURE).toLowerCase() === "true",
    family: 4,
    // When connecting to a bare IP, validate TLS against the real hostname.
    ...(usingIp ? { tls: { servername: MAIL_HOST } } : {}),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

// Start with a hostname-based transport, then upgrade to an IPv4-pinned one
// as soon as DNS resolves (non-blocking so startup never hangs on it).
let mailTransporter = createMailTransport(MAIL_HOST);

dns.promises
  .lookup(MAIL_HOST, { family: 4 })
  .then(({ address }) => {
    mailTransporter = createMailTransport(address);
    console.log(`Mail transport pinned to IPv4 ${address} (${MAIL_HOST}).`);
  })
  .catch((err) => {
    console.error("Could not resolve mail host to IPv4; using hostname:", err.message);
  });

// Cloud hosts (Railway) commonly block outbound SMTP ports, so prefer an
// HTTP email API (port 443) when configured; fall back to SMTP for local dev.
// SendGrid is the option that works WITHOUT owning a domain — verify a single
// sender email (e.g. a Gmail address) and send to anyone. Resend needs a
// verified domain to send to arbitrary recipients. All email goes through
// sendEmail() so callers don't care which provider is active.
const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const sendgridEnabled = Boolean(process.env.SENDGRID_API_KEY);
if (sendgridEnabled) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Public logo URL for email templates (the HTTP APIs have no inline-CID
// attachments; a hosted image works for every provider). Served by the frontend.
const LOGO_URL = `${process.env.FRONTEND_URL || "http://localhost:5173"}/logo-verde.png`;

async function sendEmail({ to, subject, html }) {
  const from = process.env.MAIL_FROM || "VetCare <onboarding@resend.dev>";

  if (sendgridEnabled) {
    await sgMail.send({ to, from, subject, html });
    if (process.env.NODE_ENV !== "test") console.log(`Email sent via SendGrid to ${to}`);
    return;
  }

  if (resendClient) {
    const { error } = await resendClient.emails.send({ from, to, subject, html });
    if (error) throw new Error(error.message || "Resend send failed");
    if (process.env.NODE_ENV !== "test") console.log(`Email sent via Resend to ${to}`);
    return;
  }

  await mailTransporter.sendMail({ from, to, subject, html });
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function formatDateForEmail(dateValue) {
  if (!dateValue) return "fecha no disponible";

  const date = new Date(dateValue);

  return date.toLocaleString("es-DO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getReminderConfig(tipo, row) {
  if (tipo === "atrasada") {
    return {
      subject: `Seguimiento pendiente de consulta - ${row.mascota_nombre}`,
      title: "Consulta pendiente de seguimiento",
      message: `Le informamos que la consulta o seguimiento de su mascota <strong>${row.mascota_nombre}</strong> se encuentra pendiente.`,
      footer:
        "Le recomendamos comunicarse con la clínica a la mayor brevedad para reprogramar la cita y dar continuidad a la atención médica.",
      fieldLabel: "Fecha registrada",
      fieldValue: formatDateForEmail(row.proxima_cita),
      notifiedField: "atrasoNotificadoAt",
      logLabel: "consulta atrasada",
    };
  }

  if (tipo === "manana") {
    return {
      subject: `Recordatorio de cita programada - ${row.mascota_nombre}`,
      title: "Recordatorio de cita para mañana",
      message: `Le recordamos que su mascota <strong>${row.mascota_nombre}</strong> tiene una cita programada para mañana en nuestra veterinaria.`,
      footer:
        "En caso de no poder asistir en el horario indicado, por favor comuníquese con nosotros con anticipación para ayudarle a reprogramar.",
      fieldLabel: "Fecha y hora de la cita",
      fieldValue: formatDateForEmail(row.proxima_cita),
      notifiedField: "recordatorioMananaEnviadoAt",
      logLabel: "cita de mañana",
    };
  }

  throw new Error(`Tipo de recordatorio no soportado: ${tipo}`);
}

async function enviarCorreoConsulta({ row, tipo, marcarNotificado = true }) {
  const config = getReminderConfig(tipo, row);

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f5f7fa; padding:24px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">

        <div style="padding:28px 32px 10px; text-align:center;">
          <img src="${LOGO_URL}" width="72" alt="VetCare" style="display:block; margin:0 auto 12px;" />
          <h1 style="margin:0; font-size:28px; color:#2a9d8f; font-weight:700;">VetCare</h1>
          <p style="margin:8px 0 0; color:#6b7280; font-size:14px;">
            Cuidado veterinario con seguimiento oportuno
          </p>
        </div>

        <div style="padding:24px 32px 32px; color:#1f2937; line-height:1.6;">
          <h2 style="margin:0 0 16px; font-size:22px; color:#111827; text-align:center;">
            ${config.title}
          </h2>

          <p style="margin:0 0 16px;">
            Estimado/a${row.cliente_nombre ? ` <strong>${row.cliente_nombre}</strong>` : ""},
          </p>

          <p style="margin:0 0 18px;">
            ${config.message}
          </p>

          <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:18px 20px; margin:20px 0;">
            <p style="margin:0 0 10px;"><strong>Mascota:</strong> ${row.mascota_nombre}</p>
            <p style="margin:0 0 10px;"><strong>Motivo de la consulta:</strong> ${row.motivo || "No especificado"}</p>
            <p style="margin:0;"><strong>${config.fieldLabel}:</strong> ${config.fieldValue}</p>
          </div>

          <p style="margin:0 0 16px;">
            ${config.footer}
          </p>

          <p style="margin:0 0 16px;">
            Agradecemos su confianza en nuestro equipo. Mantener el seguimiento de las citas contribuye al bienestar y la salud de su mascota.
          </p>

          <div style="margin-top:28px; padding-top:18px; border-top:1px solid #e5e7eb; font-size:13px; color:#6b7280;">
            <p style="margin:0 0 6px;"><strong>VetCare</strong></p>
            <p style="margin:0;">Este es un mensaje automático del sistema de recordatorios.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  await sendEmail({ to: row.cliente_correo, subject: config.subject, html });

  if (marcarNotificado) {
    await prisma.consultation.update({
      where: { id: row.id },
      data: { [config.notifiedField]: new Date() },
    });
  }

  console.log(
    `Correo enviado por ${config.logLabel}. Consulta: ${row.id}, email: ${row.cliente_correo}`
  );
}

function consultaReminderRow(c) {
  return {
    id: c.id,
    fecha: c.fecha,
    proxima_cita: c.proximaCita,
    motivo: c.motivo,
    estado: c.estado,
    client_id: c.clientId,
    cliente_correo: c.client.email,
    cliente_nombre: `${c.client.firstName} ${c.client.lastName}`,
    mascota_nombre: c.pet.name,
  };
}

async function enviarCorreosConsultasManana() {
  try {
    const tomorrowStart = new Date();
    tomorrowStart.setHours(0, 0, 0, 0);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const dayAfterStart = new Date(tomorrowStart);
    dayAfterStart.setDate(dayAfterStart.getDate() + 1);

    const consultas = await prisma.consultation.findMany({
      where: {
        deletedAt: null,
        proximaCita: { gte: tomorrowStart, lt: dayAfterStart },
        recordatorioMananaEnviadoAt: null,
        client: { deletedAt: null, email: { not: null } },
        pet: { deletedAt: null },
      },
      include: { client: true, pet: true },
      orderBy: { proximaCita: "asc" },
    });

    for (const c of consultas) {
      if (!c.client.email || !c.client.email.trim()) continue;

      const row = consultaReminderRow(c);

      try {
        await enviarCorreoConsulta({ row, tipo: "manana", marcarNotificado: true });
        console.log(`Correo de cita para mañana enviado. Consulta: ${row.id}`);
      } catch (mailError) {
        console.error(`Error enviando correo de mañana ${row.id}:`, mailError);
      }
    }
  } catch (error) {
    console.error("Error revisando citas de mañana:", error);
  }
}

async function enviarCorreosConsultasAtrasadas() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const consultas = await prisma.consultation.findMany({
      where: {
        deletedAt: null,
        proximaCita: { not: null, lt: todayStart },
        atrasoNotificadoAt: null,
        client: { deletedAt: null, email: { not: null } },
        pet: { deletedAt: null },
      },
      include: { client: true, pet: true },
      orderBy: { proximaCita: "asc" },
    });

    for (const c of consultas) {
      if (!c.client.email || !c.client.email.trim()) continue;

      const row = consultaReminderRow(c);

      try {
        await enviarCorreoConsulta({ row, tipo: "atrasada", marcarNotificado: true });
        console.log(
          `Correo enviado por consulta atrasada. Consulta: ${row.id}, email: ${row.cliente_correo}`
        );
      } catch (mailError) {
        console.error(`Error enviando correo de consulta atrasada ${row.id}:`, mailError);
      }
    }
  } catch (error) {
    console.error("Error revisando consultas atrasadas:", error);
  }
}

// =============================
// AUTH / ROLE GUARDS
// =============================
function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No autorizado. Token requerido.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token inválido o expirado.",
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Acceso denegado.",
      });
    }
    next();
  };
}

const requireAdmin = requireRole("ADMIN");
// Front-desk (secretary) endpoints — any staff role.
const requireStaff = requireRole("ADMIN", "DOCTOR", "STAFF");
// Clinical writes (consultations, prescriptions) — doctors and admins only.
// STAFF may still read clinical history via the plain requireStaff routes below.
const requireClinical = requireRole("ADMIN", "DOCTOR");

function requireClient(req, res, next) {
  if (!req.user || req.user.role !== "CLIENT" || !req.user.client_id) {
    return res.status(403).json({
      message: "Acceso exclusivo para clientes del portal.",
    });
  }
  next();
}

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Demasiadas solicitudes. Intenta nuevamente en unos minutos.",
  },
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 6,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Demasiados intentos de inicio de sesión. Intenta dentro de 15 minutos.",
  },
});

app.use("/api", apiLimiter);

// =============================
// TEST ROUTE
// =============================
app.get("/test", (req, res) => {
  res.json({ ok: true, message: "backend funcionando correctamente" });
});

// =============================
// REGISTER CLIENT
// =============================
app.post("/api/clientes", requireAuth, async (req, res) => {
  try {
    const { nombre, cedula, direccion, correo, telefono, telefono2 } = req.body;

    if (!nombre || !cedula || !direccion || !correo || !telefono) {
      return res.status(400).json({
        message: "Complete todos los campos requeridos",
      });
    }

    const existingClient = await prisma.client.findFirst({
      where: { nationalId: cedula.trim(), deletedAt: null },
      select: { id: true },
    });

    if (existingClient) {
      return res.status(409).json({
        message: "Ya existe un cliente con dicha cédula",
      });
    }

    const nameParts = nombre.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";

    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        nationalId: cedula.trim(),
        email: correo.trim().toLowerCase(),
        phonePrimary: telefono.trim(),
        phoneSecondary: telefono2?.trim() || null,
        addressLine1: direccion.trim(),
      },
    });

    return res.status(201).json({
      message: "Usuario guardado exitosamente",
      client: {
        id: client.id,
        nombre,
        cedula,
        direccion,
        correo,
        telefono,
        telefono2,
      },
    });
  } catch (error) {
    console.error("Error saving client:", error);

    return res.status(500).json({
      message:
        "El correo suministrado ya está registrado u ocurrió un error al guardar el cliente.",
    });
  }
});

// =============================
// GET CLIENTS
// Filtro por id
// =============================
app.get("/api/clientes", requireAuth, async (req, res) => {
  try {
    const { id, estado } = req.query;

    const where = {};
    if (id) where.id = id;
    if (estado === "activo") where.deletedAt = null;
    if (estado === "inactivo") where.deletedAt = { not: null };

    const clients = await prisma.client.findMany({
      where,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return res.json(
      clients.map((c) => ({
        id: c.id,
        nombre: `${c.firstName} ${c.lastName}`,
        cedula: c.nationalId,
        direccion: c.addressLine1,
        correo: c.email,
        telefono: c.phonePrimary,
        telefono2: c.phoneSecondary,
        estado: c.deletedAt === null ? "activo" : "inactivo",
      }))
    );
  } catch (error) {
    console.error("Error loading clients:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
});

app.get("/db-check", async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`SELECT NOW() AS now_time`;
    res.json({ ok: true, rows });
  } catch (error) {
    console.error("DB CHECK ERROR:", error);
    res.status(500).json({
      ok: false,
      message: error.message,
    });
  }
});

// =============================
// REGISTER PET
// =============================
app.post("/api/mascotas", requireAuth, async (req, res) => {
  try {
    const { clienteId, nombre, edad, raza, sexo, peso, observaciones } = req.body;

    if (!clienteId || !nombre || !edad || !raza || !sexo || !peso) {
      return res.status(400).json({
        message: "Complete todos los campos obligatorios.",
      });
    }

    const client = await prisma.client.findFirst({
      where: { id: clienteId, deletedAt: null },
      select: { id: true },
    });

    if (!client) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    let sexValue = "UNKNOWN";
    if (sexo === "Macho") sexValue = "MALE";
    if (sexo === "Hembra") sexValue = "FEMALE";

    const pet = await prisma.pet.create({
      data: {
        clientId,
        name: nombre.trim(),
        breed: raza.trim(),
        sex: sexValue,
        ageYears: parseInt(edad, 10),
        weightKg: parseFloat(peso),
        weightText: String(peso),
        observations: observaciones || null,
      },
    });

    return res.status(201).json({
      message: "Mascota guardada exitosamente.",
      pet: { id: pet.id },
    });
  } catch (error) {
    console.error("Error al guardar la mascota:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
});

app.put("/api/clientes/:id/toggle", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await prisma.client.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!cliente) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    await prisma.client.update({
      where: { id },
      data: { deletedAt: cliente.deletedAt === null ? new Date() : null },
    });

    return res.json({
      message: "Estado actualizado",
    });
  } catch (error) {
    console.error("Error toggling cliente:", error);
    return res.status(500).json({
      message: "Error actualizando estado",
    });
  }
});

app.put("/api/clientes/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { nombre, cedula, direccion, correo, telefono, telefono2 } = req.body;

  try {
    const existing = await prisma.client.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const cleanNombre = String(nombre || "").trim();
    const cleanCedula = String(cedula || "").trim();
    const cleanDireccion = String(direccion || "").trim();
    const cleanCorreo = String(correo || "").trim().toLowerCase();
    const cleanTelefono = String(telefono || "").trim();
    const cleanTelefono2 = String(telefono2 || "").trim();

    if (!cleanNombre || !cleanCedula || !cleanDireccion || !cleanCorreo || !cleanTelefono) {
      return res.status(400).json({
        message: "Complete todos los campos requeridos",
      });
    }

    const existingCedula = await prisma.client.findFirst({
      where: { nationalId: cleanCedula, id: { not: id } },
      select: { id: true },
    });

    if (existingCedula) {
      return res.status(409).json({
        message: "Ya existe otro usuario con esa cédula",
      });
    }

    const existingCorreo = await prisma.client.findFirst({
      where: { email: cleanCorreo, id: { not: id } },
      select: { id: true },
    });

    if (existingCorreo) {
      return res.status(409).json({
        message: "Ya existe otro cliente con ese correo",
      });
    }

    const nameParts = cleanNombre.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";

    await prisma.client.update({
      where: { id },
      data: {
        firstName,
        lastName,
        nationalId: cleanCedula,
        email: cleanCorreo,
        phonePrimary: cleanTelefono,
        phoneSecondary: cleanTelefono2 || null,
        addressLine1: cleanDireccion,
      },
    });

    return res.json({
      message: "Usuario actualizado correctamente.",
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return res.status(500).json({
      message: "Error actualizando usuario.",
    });
  }
});

// =============================
// GET PETS
// Filtro por id y clienteId
// =============================
app.get("/api/mascotas", requireAuth, async (req, res) => {
  try {
    const { id, clienteId, estado } = req.query;

    const where = {};
    if (id) where.id = id;
    if (clienteId) where.clientId = clienteId;
    if (estado === "activo") where.deletedAt = null;
    if (estado === "inactivo") where.deletedAt = { not: null };

    const pets = await prisma.pet.findMany({
      where,
      include: { client: { select: { firstName: true, lastName: true } } },
      orderBy: { name: "asc" },
    });

    return res.json(
      pets.map((p) => ({
        id: p.id,
        clienteId: p.clientId,
        client_id: p.clientId,
        nombre: p.name,
        name: p.name,
        raza: p.breed,
        breed: p.breed,
        edad: p.ageYears,
        age_years: p.ageYears,
        sexo: p.sex,
        peso: p.weightKg,
        weight_kg: p.weightKg,
        observaciones: p.observations,
        first_name: p.client.firstName,
        last_name: p.client.lastName,
        estado: p.deletedAt === null ? "activo" : "inactivo",
      }))
    );
  } catch (error) {
    console.error("Error al cargar las mascotas:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
});

app.put("/api/mascotas/:id/toggle", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const mascota = await prisma.pet.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!mascota) {
      return res.status(404).json({
        message: "Mascota no encontrada",
      });
    }

    await prisma.pet.update({
      where: { id },
      data: { deletedAt: mascota.deletedAt === null ? new Date() : null },
    });

    return res.json({
      message: "Estado actualizado",
    });
  } catch (error) {
    console.error("Error toggling mascota:", error);
    return res.status(500).json({
      message: "Error actualizando estado",
    });
  }
});

app.put("/api/mascotas/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { nombre, edad, raza, sexo, peso, observaciones } = req.body;

  try {
    const existing = await prisma.pet.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({
        message: "Mascota no encontrada",
      });
    }

    let sexValue = null;
    if (sexo === "Macho" || sexo === "MALE") sexValue = "MALE";
    if (sexo === "Hembra" || sexo === "FEMALE") sexValue = "FEMALE";
    if (!sexValue) sexValue = "UNKNOWN";

    await prisma.pet.update({
      where: { id },
      data: {
        name: nombre || undefined,
        breed: raza || null,
        sex: sexValue,
        ageYears: edad ? Number(edad) : null,
        weightKg: peso ? Number(peso) : null,
        weightText: peso ? String(peso) : null,
        observations: observaciones || null,
      },
    });

    return res.json({
      message: "Mascota actualizada correctamente.",
    });
  } catch (error) {
    console.error("Error updating pet:", error);
    return res.status(500).json({
      message: "Error actualizando mascota.",
    });
  }
});

// =============================
// GET DOCTORS
// `id` is the underlying User id (role DOCTOR) so it lines up with
// Consultation.doctorId / Appointment.doctorId, which reference users.id.
// =============================
app.get("/api/doctores", requireAuth, async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: { deletedAt: null },
      orderBy: { fullName: "asc" },
    });

    return res.json(
      doctors.map((d) => ({
        id: d.userId,
        user_id: d.userId,
        nombre: d.fullName,
        specialty: d.specialty,
        license_number: d.licenseNumber,
        created_at: d.createdAt,
        updated_at: d.updatedAt,
      }))
    );
  } catch (error) {
    console.error("Error loading doctors:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// =============================
// GET TIPOS DE CONSULTA
// =============================
app.get("/api/tipos-consulta", requireAuth, async (req, res) => {
  try {
    const tipos = await prisma.tipoConsulta.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: "asc" },
      select: { id: true, codigo: true, nombre: true },
    });

    return res.json(tipos);
  } catch (error) {
    console.error("Error loading tipos_consulta:", error);

    return res.status(500).json({
      message: "Error interno al cargar tipos de consulta.",
      error: error.message,
    });
  }
});

// =============================
// STATS
// =============================
app.get("/api/stats", requireAuth, async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() + 3);

    const [clientes, mascotas, consultas, alertas] = await Promise.all([
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.pet.count({ where: { deletedAt: null } }),
      prisma.consultation.count({ where: { deletedAt: null } }),
      prisma.consultation.count({
        where: {
          deletedAt: null,
          OR: [
            { proximaCita: { not: null, lte: cutoff } },
            { estado: "seguimiento" },
          ],
        },
      }),
    ]);

    return res.json({ clientes, mascotas, consultas, alertas });
  } catch (error) {
    console.error("Error loading stats:", error);

    return res.status(500).json({
      message: "Error interno al cargar estadísticas.",
      error: error.message,
    });
  }
});

// =============================
// ALERTAS
// =============================
app.get("/api/alertas", requireAuth, async (req, res) => {
  try {
    const consultas = await prisma.consultation.findMany({
      where: {
        deletedAt: null,
        OR: [{ estado: "seguimiento" }, { proximaCita: { not: null } }],
      },
      include: {
        pet: { select: { name: true, breed: true } },
        client: { select: { firstName: true, lastName: true, phonePrimary: true } },
        doctor: { select: { doctorProfile: { select: { fullName: true } } } },
      },
      // Postgres sorts NULLs last on ASC by default, matching the original
      // "proxima_cita IS NULL last" ordering without an explicit CASE.
      orderBy: [{ proximaCita: "asc" }, { createdAt: "desc" }],
    });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const alertas = consultas.map((c) => {
      let categoria = "proximas";

      if (c.proximaCita) {
        const cita = new Date(c.proximaCita);
        cita.setHours(0, 0, 0, 0);

        if (cita < hoy) {
          categoria = "atrasadas";
        } else if (cita.getTime() === hoy.getTime()) {
          categoria = "hoy";
        } else if (cita.getTime() === manana.getTime()) {
          categoria = "manana";
        } else {
          categoria = "proximas";
        }
      } else if (c.estado === "seguimiento") {
        categoria = "proximas";
      }

      return {
        id: c.id,
        pet_id: c.petId,
        client_id: c.clientId,
        doctor_id: c.doctorId,
        fecha: c.fecha,
        proxima_cita: c.proximaCita,
        motivo: c.motivo,
        diagnostico: c.diagnostico,
        observaciones: c.observaciones,
        estado: c.estado,
        gravedad: c.gravedad,
        mascota_nombre: c.pet.name,
        mascota_raza: c.pet.breed,
        cliente_nombre: `${c.client.firstName} ${c.client.lastName}`,
        cliente_telefono: c.client.phonePrimary,
        doctor_nombre: c.doctor?.doctorProfile?.fullName ?? null,
        categoria,
      };
    });

    const resumen = {
      atrasadas: alertas.filter((a) => a.categoria === "atrasadas").length,
      hoy: alertas.filter((a) => a.categoria === "hoy").length,
      manana: alertas.filter((a) => a.categoria === "manana").length,
      proximas: alertas.filter((a) => a.categoria === "proximas").length,
      total: alertas.length,
    };

    return res.json({ resumen, alertas });
  } catch (error) {
    console.error("Error loading alertas:", error);

    return res.status(500).json({
      message: "No se pudieron cargar las alertas.",
      error: error.message,
    });
  }
});

app.put("/api/alertas/:id/quitar", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const consulta = await prisma.consultation.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, estado: true },
    });

    if (!consulta) {
      return res.status(404).json({
        message: "Alerta no encontrada.",
      });
    }

    await prisma.consultation.update({
      where: { id },
      data: {
        proximaCita: null,
        motivoSeguimiento: null,
        estado: consulta.estado === "seguimiento" ? "cerrada" : consulta.estado,
      },
    });

    return res.json({
      message: "Alerta eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error quitando alerta:", error);
    return res.status(500).json({
      message: "Error al eliminar la alerta.",
    });
  }
});

// =============================
// REGISTER CONSULTA
// Clinical write — restricted to ADMIN/DOCTOR (secretary is read-only here).
// =============================
app.post(
  "/api/consultas",
  requireAuth,
  requireClinical,
  upload.array("adjuntos", 10),
  async (req, res) => {
    try {
      const {
        pet_id,
        client_id,
        doctor_id,
        fecha,
        hora,
        motivo,
        diagnostico,
        observaciones,
        estado,
        gravedad,
        proxima_cita,
        motivo_seguimiento,
        notas_medicacion,
        notas_analisis,
        lote_vacuna,
        weight,
        temp,
        hr,
        rr,
        bp,
        spo2,
        meses_gestacion,
        cantidad_crias,
        riesgo_embarazo,
        tipo_parto,
        fecha_probable_parto,
      } = req.body;

      const medicaciones = parseJsonArray(req.body.medicaciones);
      const analisis = parseJsonArray(req.body.analisis);
      const vacunas = parseJsonArray(req.body.vacunas);
      const tiposConsulta = parseJsonArray(req.body.tipos_consulta);

      if (!pet_id || !client_id || !doctor_id || !fecha || !motivo) {
        return res.status(400).json({
          message: "Faltan campos obligatorios para guardar la consulta.",
        });
      }

      const fechaHora = new Date(`${fecha}T${hora || "00:00"}:00`);

      const consulta = await prisma.$transaction(async (tx) => {
        const created = await tx.consultation.create({
          data: {
            petId: pet_id,
            clientId: client_id,
            doctorId: doctor_id,
            fecha: fechaHora,
            motivo,
            diagnostico: diagnostico || null,
            observaciones: observaciones || null,
            estado: estado || "abierta",
            gravedad: gravedad || "moderada",
            proximaCita: proxima_cita ? new Date(proxima_cita) : null,
            motivoSeguimiento: motivo_seguimiento || null,
            peso: toNullableNumber(weight),
            temperatura: toNullableNumber(temp),
            frecuenciaCardiaca: toNullableNumber(hr),
            frecuenciaRespiratoria: toNullableNumber(rr),
            presionArterial: bp ? String(bp) : null,
            saturacionOxigeno: toNullableNumber(spo2),
          },
        });

        if (Array.isArray(tiposConsulta) && tiposConsulta.length > 0) {
          for (const tipoCodigo of tiposConsulta) {
            const codigo = String(tipoCodigo || "").trim();
            if (!codigo) continue;

            const tipo = await tx.tipoConsulta.findFirst({
              where: { codigo, deletedAt: null },
              select: { id: true },
            });
            if (!tipo) continue;

            await tx.consultationType.create({
              data: { consultationId: created.id, tipoConsultaId: tipo.id },
            });
          }
        }

        if (Array.isArray(tiposConsulta) && tiposConsulta.includes("emb")) {
          await tx.pregnancyConsultation.create({
            data: {
              consultationId: created.id,
              mesesGestacion: meses_gestacion ? Number(meses_gestacion) : null,
              cantidadCrias: cantidad_crias ? Number(cantidad_crias) : null,
              riesgo: riesgo_embarazo || "bajo",
              tipoParto: tipo_parto || null,
              fechaProbableParto: fecha_probable_parto
                ? new Date(fecha_probable_parto)
                : null,
            },
          });
        }

        if (Array.isArray(medicaciones) && medicaciones.length > 0) {
          for (const medicamento of medicaciones) {
            const valor = String(medicamento || "").trim();
            if (!valor) continue;

            await tx.medication.create({
              data: {
                consultationId: created.id,
                medicamento: valor,
                indicaciones: notas_medicacion || null,
              },
            });
          }
        }

        if (Array.isArray(analisis) && analisis.length > 0) {
          for (const analisisItem of analisis) {
            const valor = String(analisisItem || "").trim();
            if (!valor) continue;

            await tx.laboratoryAnalysis.create({
              data: {
                consultationId: created.id,
                analisis: valor,
                resultadoObservacion: notas_analisis || null,
              },
            });
          }
        }

        if (Array.isArray(vacunas) && vacunas.length > 0) {
          for (const vacuna of vacunas) {
            const item = vacuna && typeof vacuna === "object" ? vacuna : { vacuna };
            const valor = String(item.vacuna || "").trim();
            if (!valor) continue;

            await tx.vaccination.create({
              data: {
                consultationId: created.id,
                vacuna: valor,
                fechaAplicacion: item.fecha_aplicacion ? new Date(item.fecha_aplicacion) : null,
                fechaRefuerzo: item.fecha_refuerzo ? new Date(item.fecha_refuerzo) : null,
                lote: item.lote || null,
                laboratorio: item.laboratorio || null,
                veterinario: item.veterinario || null,
                loteObservaciones: item.lote_observaciones || lote_vacuna || null,
              },
            });
          }
        }

        if (Array.isArray(req.files) && req.files.length > 0) {
          for (const file of req.files) {
            const publicPath = `/uploads/consultas/${file.filename}`;

            await tx.attachment.create({
              data: {
                consultationId: created.id,
                nombreArchivo: file.originalname,
                rutaArchivo: publicPath,
                tipoArchivo: file.mimetype || null,
                tamanoBytes: file.size || null,
              },
            });
          }
        }

        return created;
      });

      return res.status(201).json({
        message: "Consulta guardada correctamente.",
        consulta: { id: consulta.id, tipos_consulta: tiposConsulta },
      });
    } catch (error) {
      console.error("Error saving consulta:", error);

      return res.status(500).json({
        message: "Error interno al guardar la consulta.",
        error: error.message,
      });
    }
  }
);

// Shared shape used by the consulta detail endpoint, the pet clinical
// history endpoint, and the client-portal equivalent.
function serializeConsultaDetail(c) {
  const tipos = (c.types || [])
    .map((t) => t.tipoConsulta)
    .filter(Boolean)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return {
    id: c.id,
    pet_id: c.petId,
    client_id: c.clientId,
    doctor_id: c.doctorId,
    visit_at: c.fecha,
    reason: c.motivo,
    diagnosis: c.diagnostico,
    notes: c.observaciones,
    estado: c.estado,
    gravedad: c.gravedad,
    proxima_cita: c.proximaCita,
    motivo_seguimiento: c.motivoSeguimiento,
    peso: c.peso,
    temperatura: c.temperatura,
    frecuencia_cardiaca: c.frecuenciaCardiaca,
    frecuencia_respiratoria: c.frecuenciaRespiratoria,
    presion_arterial: c.presionArterial,
    saturacion_oxigeno: c.saturacionOxigeno,
    doctor: c.doctor?.doctorProfile?.fullName ?? null,
    tipos_consulta: tipos.map((t) => t.codigo),
    tipos_consulta_detalle: tipos.map((t) => ({ id: t.id, codigo: t.codigo, nombre: t.nombre })),
    treatment:
      (c.medications || []).length > 0
        ? c.medications.map((m) => m.medicamento).join(", ")
        : null,
    medicaciones: (c.medications || []).map((m) => ({
      medicamento: m.medicamento,
      indicaciones: m.indicaciones,
    })),
    analisis: (c.analyses || []).map((a) => ({
      analisis: a.analisis,
      resultado_observacion: a.resultadoObservacion,
    })),
    vacunas: (c.vaccinations || []).map((v) => ({
      vacuna: v.vacuna,
      fecha_aplicacion: v.fechaAplicacion,
      fecha_refuerzo: v.fechaRefuerzo,
      lote: v.lote,
      laboratorio: v.laboratorio,
      veterinario: v.veterinario,
      lote_observaciones: v.loteObservaciones,
    })),
    adjuntos: (c.attachments || []).map((a) => ({
      nombre_archivo: a.nombreArchivo,
      ruta_archivo: a.rutaArchivo,
      tipo_archivo: a.tipoArchivo,
      tamano_bytes: a.tamanoBytes,
    })),
  };
}

const consultaDetailInclude = {
  doctor: { select: { doctorProfile: { select: { fullName: true } } } },
  types: { where: { deletedAt: null }, include: { tipoConsulta: true } },
  medications: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
  analyses: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
  vaccinations: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
  attachments: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
};

async function getConsultasByPet(petId) {
  const consultas = await prisma.consultation.findMany({
    where: { petId, deletedAt: null },
    include: consultaDetailInclude,
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
  });

  return consultas.map(serializeConsultaDetail);
}

// =============================
// CONSULTATION ID
// =============================
app.get("/api/consultas/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const consulta = await prisma.consultation.findFirst({
      where: { id, deletedAt: null },
      include: consultaDetailInclude,
    });

    if (!consulta) {
      return res.status(404).json({
        message: "Consulta no encontrada.",
      });
    }

    return res.json(serializeConsultaDetail(consulta));
  } catch (error) {
    console.error("Error loading consulta detail:", error);

    return res.status(500).json({
      message: "Error interno al cargar la consulta.",
      error: error.message,
    });
  }
});

app.put("/api/consultas/:id", requireAuth, requireClinical, async (req, res) => {
  const { id } = req.params;

  const {
    doctor_id,
    pet_id,
    client_id,
    fecha,
    motivo,
    diagnostico,
    observaciones,
    estado,
    gravedad,
    proxima_cita,
    motivo_seguimiento,
  } = req.body;

  try {
    const exists = await prisma.consultation.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!exists) {
      return res.status(404).json({ message: "Consulta no encontrada." });
    }

    await prisma.consultation.update({
      where: { id },
      data: {
        doctorId: doctor_id || null,
        petId: pet_id || undefined,
        clientId: client_id || undefined,
        fecha: fecha ? new Date(fecha) : undefined,
        motivo: motivo || undefined,
        diagnostico: diagnostico || null,
        observaciones: observaciones || null,
        estado: estado || undefined,
        gravedad: gravedad || undefined,
        proximaCita: proxima_cita ? new Date(proxima_cita) : null,
        motivoSeguimiento: motivo_seguimiento || null,
      },
    });

    return res.json({
      message: "Consulta actualizada correctamente.",
    });
  } catch (error) {
    console.error("Error actualizando consulta:", error);
    return res.status(500).json({
      message: "Error al actualizar la consulta.",
    });
  }
});

app.delete("/api/consultas/:id", requireAuth, requireClinical, async (req, res) => {
  const { id } = req.params;

  try {
    const exists = await prisma.consultation.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!exists) {
      return res.status(404).json({ message: "Consulta no encontrada." });
    }

    await prisma.consultation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.json({
      message: "Consulta eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error eliminando consulta:", error);
    return res.status(500).json({
      message: "Error al eliminar la consulta.",
    });
  }
});

// =============================
// GET PET CLINICAL HISTORY
// =============================
app.get("/api/mascotas/:mascotaId/consultas", requireAuth, async (req, res) => {
  try {
    const { mascotaId } = req.params;

    if (!mascotaId) {
      return res.status(400).json({
        message: "ID de mascota es requerido.",
      });
    }

    const resultado = await getConsultasByPet(mascotaId);

    return res.json(resultado);
  } catch (error) {
    console.error("Error loading clinical history:", error);

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// =============================
// REGISTER USER
// =============================
app.post("/api/auth/register", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      email,
      firstName,
      lastName,
      fullName,
      specialty,
      licenseNumber,
    } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        message: "Username, password and role are required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanRole = role.trim().toUpperCase();
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;

    if (!cleanUsername || !cleanPassword || !cleanRole) {
      return res.status(400).json({
        message: "Username, password and role are required.",
      });
    }

    const allowedRoles = ["ADMIN", "DOCTOR", "STAFF"];

    if (!allowedRoles.includes(cleanRole)) {
      return res.status(400).json({
        message: "Invalid role. Allowed: ADMIN, DOCTOR, STAFF",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: { username: cleanUsername, deletedAt: null },
      select: { id: true },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists.",
      });
    }

    if (cleanEmail) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: cleanEmail, deletedAt: null },
        select: { id: true },
      });

      if (existingEmail) {
        return res.status(409).json({
          message: "Email already exists.",
        });
      }
    }

    if (cleanRole === "DOCTOR" && (!fullName || !String(fullName).trim())) {
      return res.status(400).json({
        message: "El nombre completo es requerido para cuentas de doctor.",
      });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          firstName: firstName ? String(firstName).trim() : null,
          lastName: lastName ? String(lastName).trim() : null,
          passwordHash,
          role: cleanRole,
        },
      });

      if (cleanRole === "DOCTOR") {
        await tx.doctor.create({
          data: {
            userId: created.id,
            fullName: String(fullName).trim(),
            specialty: specialty ? String(specialty).trim() : null,
            licenseNumber: licenseNumber ? String(licenseNumber).trim() : null,
          },
        });
      }

      return created;
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
});

// =============================
// SIGNUP (public — client self-registration)
// =============================
app.post("/api/auth/signup", authLimiter, async (req, res) => {
  try {
    const { nombre, apellido, cedula, telefono, correo, password } = req.body;

    if (!nombre || !apellido || !cedula || !telefono || !correo || !password) {
      return res.status(400).json({
        message: "Complete todos los campos requeridos.",
      });
    }

    const cleanCedula = String(cedula).trim();
    const cleanEmail = String(correo).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    if (cleanPassword.length < 8) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres.",
      });
    }

    const existingByCedula = await prisma.client.findFirst({
      where: { nationalId: cleanCedula, deletedAt: null },
      select: { id: true },
    });

    if (existingByCedula) {
      return res.status(409).json({
        message: "Ya existe una cuenta registrada con esa cédula.",
      });
    }

    const existingByEmail = await prisma.client.findFirst({
      where: { username: cleanEmail, deletedAt: null },
      select: { id: true },
    });

    if (existingByEmail) {
      return res.status(409).json({
        message: "Ya existe una cuenta registrada con ese correo.",
      });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    const client = await prisma.client.create({
      data: {
        firstName: String(nombre).trim(),
        lastName: String(apellido).trim(),
        nationalId: cleanCedula,
        email: cleanEmail,
        phonePrimary: String(telefono).trim(),
        username: cleanEmail,
        passwordHash,
      },
    });

    const token = jwt.sign(
      { id: client.id, username: client.username, role: "CLIENT", client_id: client.id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(201).json({
      token,
      user: {
        id: client.id,
        username: client.username,
        role: "CLIENT",
        first_name: client.firstName,
        last_name: client.lastName,
        profile_photo_url: client.profilePhotoUrl,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      message: "No se pudo crear la cuenta.",
    });
  }
});

// =============================
// STAFF PROFILE (own account — any authenticated staff role)
// =============================
app.get("/api/perfil", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.id, deletedAt: null },
    });

    if (!user) {
      return res.status(404).json({ message: "Perfil no encontrado." });
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      role: user.role,
      profile_photo_url: user.profilePhotoUrl,
    });
  } catch (error) {
    console.error("Error cargando perfil:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.post(
  "/api/perfil/foto",
  requireAuth,
  uploadAvatar.single("foto"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Selecciona una imagen." });
      }

      const publicUrl = `/uploads/avatars/${req.file.filename}`;

      await prisma.user.update({
        where: { id: req.user.id },
        data: { profilePhotoUrl: publicUrl },
      });

      return res.json({ profile_photo_url: publicUrl });
    } catch (error) {
      console.error("Error subiendo foto de perfil:", error);
      return res.status(500).json({ message: error.message || "No se pudo subir la foto." });
    }
  }
);

// =============================
// FORGOT / RESET PASSWORD (public — works for staff and client accounts)
// =============================
function passwordResetEmailHtml(link) {
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f5f7fa; padding:24px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
        <div style="padding:28px 32px 10px; text-align:center;">
          <img src="${LOGO_URL}" width="72" alt="VetCare" style="display:block; margin:0 auto 12px;" />
          <h1 style="margin:0; font-size:28px; color:#2a9d8f; font-weight:700;">VetCare</h1>
        </div>
        <div style="padding:24px 32px 32px; color:#1f2937; line-height:1.6;">
          <h2 style="margin:0 0 16px; font-size:22px; color:#111827; text-align:center;">
            Restablecer contraseña
          </h2>
          <p style="margin:0 0 18px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta VetCare.
            Si fuiste tú, haz clic en el siguiente botón. Este enlace vence en 1 hora.
          </p>
          <div style="text-align:center; margin:28px 0;">
            <a href="${link}" style="background:#2a9d8f; color:#ffffff; padding:12px 28px; border-radius:10px; text-decoration:none; font-weight:600;">
              Restablecer contraseña
            </a>
          </div>
          <p style="margin:0 0 16px; color:#6b7280; font-size:13px;">
            Si no solicitaste esto, puedes ignorar este correo con seguridad.
          </p>
        </div>
      </div>
    </div>
  `;
}

app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
  const genericResponse = {
    message:
      "Si existe una cuenta con ese usuario, te enviaremos un correo con instrucciones.",
  };

  try {
    const { username } = req.body;
    if (!username) return res.status(400).json(genericResponse);

    const staffUser = await prisma.user.findFirst({
      where: { username, deletedAt: null },
      select: { id: true, email: true },
    });

    const client = staffUser
      ? null
      : await prisma.client.findFirst({
          where: { username, deletedAt: null },
          select: { id: true, email: true },
        });

    const account = staffUser || client;
    const email = account?.email;

    if (account && email) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          userId: staffUser ? account.id : null,
          clientId: staffUser ? null : account.id,
          tokenHash,
          expiresAt,
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const link = `${frontendUrl}/restablecer-contrasena?token=${rawToken}`;

      console.log(`Password reset link for ${username}: ${link}`);

      try {
        await sendEmail({
          to: email,
          subject: "Restablecer tu contraseña de VetCare",
          html: passwordResetEmailHtml(link),
        });
      } catch (mailError) {
        console.error("Error sending password reset email:", mailError);
      }
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.json(genericResponse);
  }
});

app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token y contraseña son requeridos." });
    }

    const cleanPassword = String(password).trim();
    if (cleanPassword.length < 8) {
      return res.status(400).json({
        message: "La contraseña debe tener al menos 8 caracteres.",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(String(token)).digest("hex");

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!resetToken) {
      return res.status(400).json({
        message: "El enlace de restablecimiento no es válido o ha expirado.",
      });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    await prisma.$transaction(async (tx) => {
      if (resetToken.userId) {
        await tx.user.update({
          where: { id: resetToken.userId },
          data: { passwordHash, passwordChangedAt: new Date() },
        });
      } else if (resetToken.clientId) {
        await tx.client.update({
          where: { id: resetToken.clientId },
          data: { passwordHash },
        });
      }

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
    });

    return res.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "No se pudo restablecer la contraseña." });
  }
});

// =============================
// LOGIN
// Tries staff (users table) first, then falls back to a client account
// (clients table — only clients with a username/password_hash set can log in).
// =============================
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Nombre de usuario y contraseña son requeridos.",
      });
    }

    const staffUser = await prisma.user.findFirst({
      where: { username, deletedAt: null },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
      },
    });

    if (staffUser) {
      const valid = await bcrypt.compare(password, staffUser.passwordHash);

      if (!valid) {
        return res.status(401).json({
          message: "Usuario o contraseña incorrectos.",
        });
      }

      const token = jwt.sign(
        { id: staffUser.id, username: staffUser.username, role: staffUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({
        token,
        user: {
          id: staffUser.id,
          username: staffUser.username,
          role: staffUser.role,
          first_name: staffUser.firstName,
          last_name: staffUser.lastName,
          profile_photo_url: staffUser.profilePhotoUrl,
        },
      });
    }

    const client = await prisma.client.findFirst({
      where: { username, deletedAt: null, passwordHash: { not: null } },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        profilePhotoUrl: true,
      },
    });

    if (!client) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos.",
      });
    }

    const validClient = await bcrypt.compare(password, client.passwordHash);

    if (!validClient) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos.",
      });
    }

    const token = jwt.sign(
      { id: client.id, username: client.username, role: "CLIENT", client_id: client.id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: {
        id: client.id,
        username: client.username,
        role: "CLIENT",
        first_name: client.firstName,
        last_name: client.lastName,
        profile_photo_url: client.profilePhotoUrl,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/api/consultas/:id/enviar-recordatorio", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const consulta = await prisma.consultation.findFirst({
      where: { id, deletedAt: null },
      include: { client: true, pet: true },
    });

    if (!consulta || !consulta.client.email || !consulta.client.email.trim()) {
      return res.status(404).json({
        message: "Consulta no válida o sin correo.",
      });
    }

    const row = {
      proxima_cita: consulta.proximaCita,
      motivo: consulta.motivo,
      cliente_correo: consulta.client.email,
      cliente_nombre: `${consulta.client.firstName} ${consulta.client.lastName}`,
      mascota_nombre: consulta.pet.name,
    };

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f5f7fa; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">

          <div style="padding:28px 32px 10px; text-align:center;">
            <img src="${LOGO_URL}" width="72" alt="VetCare" style="display:block; margin:0 auto 12px;" />
            <h1 style="margin:0; font-size:28px; color:#2a9d8f; font-weight:700;">VetCare</h1>
            <p style="margin:8px 0 0; color:#6b7280; font-size:14px;">
              Cuidado veterinario con seguimiento oportuno
            </p>
          </div>

          <div style="padding:24px 32px 32px; color:#1f2937; line-height:1.6;">
            <h2 style="margin:0 0 16px; font-size:22px; color:#111827; text-align:center;">
              Recordatorio de consulta
            </h2>

            <p style="margin:0 0 16px;">
              Estimado/a${row.cliente_nombre ? ` <strong>${row.cliente_nombre}</strong>` : ""},
            </p>

            <p style="margin:0 0 18px;">
              Le recordamos la consulta programada para su mascota <strong>${row.mascota_nombre}</strong>.
            </p>

            <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:18px 20px; margin:20px 0;">
              <p style="margin:0 0 10px;"><strong>Mascota:</strong> ${row.mascota_nombre}</p>
              <p style="margin:0 0 10px;"><strong>Motivo de la consulta:</strong> ${row.motivo || "No especificado"}</p>
              <p style="margin:0;"><strong>Fecha y hora:</strong> ${formatDateForEmail(row.proxima_cita)}</p>
            </div>

            <p style="margin:0 0 16px;">
              Si necesita realizar algún cambio en la cita, le recomendamos comunicarse con nosotros con anticipación.
            </p>

            <p style="margin:0 0 16px;">
              Gracias por confiar en VetCare. Será un placer atenderle.
            </p>

            <div style="margin-top:28px; padding-top:18px; border-top:1px solid #e5e7eb; font-size:13px; color:#6b7280;">
              <p style="margin:0 0 6px;"><strong>VetCare</strong></p>
              <p style="margin:0;">Este es un mensaje automático enviado desde nuestro sistema.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: row.cliente_correo,
      subject: `Recordatorio de consulta - ${row.mascota_nombre}`,
      html,
    });

    return res.json({
      message: "Correo enviado manualmente.",
    });
  } catch (error) {
    console.error("Error manual:", error);

    return res.status(500).json({
      message: "Error enviando correo.",
    });
  }
});

// =============================
// APPOINTMENTS — shared helpers
// Spanish estado/prioridad strings (the contract the frontend already
// speaks) map onto the Prisma AppointmentStatus/AppointmentPriority enums.
// =============================
const ESTADO_TO_DB = {
  PENDIENTE: "REQUESTED",
  CONFIRMADA: "SCHEDULED",
  CANCELADA: "CANCELLED",
  COMPLETADA: "COMPLETED",
};
const ESTADO_FROM_DB = {
  REQUESTED: "PENDIENTE",
  SCHEDULED: "CONFIRMADA",
  CANCELLED: "CANCELADA",
  COMPLETED: "COMPLETADA",
  NO_SHOW: "CANCELADA",
};
const PRIORIDAD_TO_DB = { NORMAL: "NORMAL", ALTA: "HIGH", URGENTE: "URGENT" };
const PRIORIDAD_FROM_DB = { LOW: "NORMAL", NORMAL: "NORMAL", HIGH: "ALTA", URGENT: "URGENTE" };

const appointmentInclude = { pet: true, client: true, appointmentType: true };

function formatFechaHora(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return {
    fecha: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hora: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function parseFechaHora(fecha, hora) {
  return new Date(`${fecha}T${hora || "00:00"}:00`);
}

// Single-row clinic settings (aggressive-pet sedation surcharge, etc).
// Created lazily if the seed migration's row is somehow missing.
async function getClinicSettings() {
  const existing = await prisma.clinicSettings.findFirst();
  if (existing) return existing;
  return prisma.clinicSettings.create({ data: {} });
}

// Aggressive pets may need a sedative, so a flat surcharge (set by admins via
// /api/admin/settings) is added on top of the appointment type's base price.
async function computeEstimatedPrice(appointmentType, isPetAggressive) {
  const base = Number(appointmentType.price || 0);
  if (!isPetAggressive) return base;
  const settings = await getClinicSettings();
  return base + Number(settings.aggressivePetSurcharge || 0);
}

function serializeAppointment(a) {
  const { fecha, hora } = formatFechaHora(a.scheduledAt);
  return {
    id: a.id,
    mascotaId: a.petId,
    mascotaNombre: a.pet?.name,
    clienteId: a.clientId,
    clienteNombre: a.client ? `${a.client.firstName} ${a.client.lastName}` : undefined,
    servicio: a.appointmentType?.name,
    prioridad: PRIORIDAD_FROM_DB[a.priority] || "NORMAL",
    fecha,
    hora,
    motivo: a.notes,
    estado: ESTADO_FROM_DB[a.status] || "PENDIENTE",
    doctorId: a.doctorId || undefined,
    createdAt: a.createdAt,
    mascotaAgresiva: a.isPetAggressive,
    precioEstimado: a.estimatedPrice,
  };
}

// Notifies the client by email when the clinic confirms, reschedules,
// rejects, or cancels one of their appointment requests. Best-effort:
// a mail failure is logged but never breaks the staff action.
async function enviarCorreoCitaEstado({ appointment, tipo, motivo }) {
  const email = appointment.client?.email;
  if (!email || !email.trim()) return;

  const { fecha, hora } = formatFechaHora(appointment.scheduledAt);
  const mascota = appointment.pet?.name || "tu mascota";
  const servicio = appointment.appointmentType?.name || "el servicio solicitado";
  const clienteNombre = `${appointment.client.firstName} ${appointment.client.lastName}`;
  const fechaLegible = formatDateForEmail(appointment.scheduledAt);

  let subject;
  let title;
  let intro;
  let showWhen = false;
  let footerNote;

  if (tipo === "confirmada") {
    subject = `Cita confirmada - ${mascota}`;
    title = "¡Tu cita fue confirmada!";
    intro = `Nos complace confirmar la cita de <strong>${mascota}</strong> para el servicio de <strong>${servicio}</strong>.`;
    showWhen = true;
    footerNote =
      "Si necesitas reprogramar o cancelar, comunícate con la clínica con anticipación.";
  } else if (tipo === "rechazada") {
    subject = `Actualización de tu solicitud de cita - ${mascota}`;
    title = "No pudimos confirmar tu solicitud";
    intro = `Lamentamos informarte que la cita solicitada para <strong>${mascota}</strong> (servicio de <strong>${servicio}</strong>) no pudo confirmarse, probablemente por disponibilidad de horario.`;
    footerNote = motivo
      ? `Motivo: ${motivo}`
      : "Puedes solicitar una nueva cita desde el portal eligiendo otro horario.";
  } else {
    subject = `Tu cita fue cancelada - ${mascota}`;
    title = "Tu cita fue cancelada";
    intro = `Te informamos que la cita de <strong>${mascota}</strong> (servicio de <strong>${servicio}</strong>) fue cancelada.`;
    footerNote = motivo
      ? `Motivo: ${motivo}`
      : "Si deseas reagendar, puedes hacerlo desde el portal cuando gustes.";
  }

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f5f7fa; padding:24px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">
        <div style="padding:28px 32px 10px; text-align:center;">
          <img src="${LOGO_URL}" width="72" alt="VetCare" style="display:block; margin:0 auto 12px;" />
          <h1 style="margin:0; font-size:28px; color:#2a9d8f; font-weight:700;">VetCare</h1>
        </div>
        <div style="padding:24px 32px 32px; color:#1f2937; line-height:1.6;">
          <h2 style="margin:0 0 16px; font-size:22px; color:#111827; text-align:center;">
            ${title}
          </h2>
          <p style="margin:0 0 16px;">
            Estimado/a <strong>${clienteNombre}</strong>,
          </p>
          <p style="margin:0 0 18px;">${intro}</p>
          <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:18px 20px; margin:20px 0;">
            <p style="margin:0 0 10px;"><strong>Mascota:</strong> ${mascota}</p>
            <p style="margin:0 0 10px;"><strong>Servicio:</strong> ${servicio}</p>
            ${showWhen ? `<p style="margin:0;"><strong>Fecha y hora:</strong> ${fechaLegible} (${hora})</p>` : ""}
          </div>
          <p style="margin:0 0 16px;">${footerNote}</p>
          <div style="margin-top:28px; padding-top:18px; border-top:1px solid #e5e7eb; font-size:13px; color:#6b7280;">
            <p style="margin:0 0 6px;"><strong>VetCare</strong></p>
            <p style="margin:0;">Este es un mensaje automático del sistema de citas.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail({ to: email, subject, html });
    console.log(`Correo de cita (${tipo}) enviado a ${email}. Cita: ${appointment.id}`);
  } catch (mailError) {
    console.error(`Error enviando correo de cita ${appointment.id}:`, mailError);
  }
}

// =============================
// APPOINTMENT TYPES — services + prices offered through the booking flow.
// =============================
app.get("/api/appointment-types", requireAuth, async (req, res) => {
  try {
    const [types, settings] = await Promise.all([
      prisma.appointmentType.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      }),
      getClinicSettings(),
    ]);

    return res.json({
      types: types.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        price: t.price,
      })),
      aggressivePetSurcharge: settings.aggressivePetSurcharge,
    });
  } catch (error) {
    console.error("Error loading appointment types:", error);
    return res.status(500).json({ message: "No se pudieron cargar los servicios." });
  }
});

app.put(
  "/api/admin/appointment-types/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { price } = req.body;

      if (price === undefined || price === null || Number.isNaN(Number(price)) || Number(price) < 0) {
        return res.status(400).json({ message: "Precio inválido." });
      }

      const type = await prisma.appointmentType.update({
        where: { id: req.params.id },
        data: { price: Number(price) },
      });

      return res.json({ id: type.id, name: type.name, price: type.price });
    } catch (error) {
      console.error("Error actualizando precio:", error);
      return res.status(500).json({ message: "No se pudo actualizar el precio." });
    }
  }
);

app.get("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const settings = await getClinicSettings();
    return res.json({ aggressivePetSurcharge: settings.aggressivePetSurcharge });
  } catch (error) {
    console.error("Error loading clinic settings:", error);
    return res.status(500).json({ message: "No se pudo cargar la configuración." });
  }
});

app.put("/api/admin/settings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { aggressivePetSurcharge } = req.body;

    if (
      aggressivePetSurcharge === undefined ||
      Number.isNaN(Number(aggressivePetSurcharge)) ||
      Number(aggressivePetSurcharge) < 0
    ) {
      return res.status(400).json({ message: "Recargo inválido." });
    }

    const settings = await getClinicSettings();
    const updated = await prisma.clinicSettings.update({
      where: { id: settings.id },
      data: { aggressivePetSurcharge: Number(aggressivePetSurcharge) },
    });

    return res.json({ aggressivePetSurcharge: updated.aggressivePetSurcharge });
  } catch (error) {
    console.error("Error actualizando configuración:", error);
    return res.status(500).json({ message: "No se pudo actualizar la configuración." });
  }
});

// =============================
// AGENDA (staff) — front-desk scheduling, all staff roles.
// =============================
app.get("/api/agenda/citas", requireAuth, requireStaff, async (req, res) => {
  try {
    const { estado, fecha } = req.query;
    const where = { deletedAt: null };

    if (estado && ESTADO_TO_DB[estado]) where.status = ESTADO_TO_DB[estado];

    if (fecha) {
      const dayStart = new Date(`${fecha}T00:00:00`);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.scheduledAt = { gte: dayStart, lt: dayEnd };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: { scheduledAt: "asc" },
    });

    return res.json(appointments.map(serializeAppointment));
  } catch (error) {
    console.error("Error loading agenda citas:", error);
    return res.status(500).json({ message: "No se pudieron cargar las citas." });
  }
});

app.post("/api/agenda/citas", requireAuth, requireStaff, async (req, res) => {
  try {
    const { mascotaId, servicio, prioridad, fecha, hora, motivo, mascotaAgresiva } = req.body;

    if (!mascotaId || !servicio || !fecha || !hora) {
      return res.status(400).json({ message: "Complete mascota, servicio, fecha y hora." });
    }

    const pet = await prisma.pet.findFirst({
      where: { id: mascotaId, deletedAt: null },
      select: { id: true, clientId: true },
    });
    if (!pet) return res.status(404).json({ message: "Mascota no encontrada." });

    const appointmentType = await prisma.appointmentType.findFirst({
      where: { name: servicio, deletedAt: null },
    });
    if (!appointmentType) return res.status(400).json({ message: "Servicio no válido." });

    const isPetAggressive = Boolean(mascotaAgresiva);
    const estimatedPrice = await computeEstimatedPrice(appointmentType, isPetAggressive);

    const appointment = await prisma.appointment.create({
      data: {
        petId: pet.id,
        clientId: pet.clientId,
        appointmentTypeId: appointmentType.id,
        scheduledAt: parseFechaHora(fecha, hora),
        status: "SCHEDULED",
        priority: PRIORIDAD_TO_DB[prioridad] || "NORMAL",
        notes: motivo || null,
        isPetAggressive,
        estimatedPrice,
      },
      include: appointmentInclude,
    });

    return res.status(201).json(serializeAppointment(appointment));
  } catch (error) {
    console.error("Error creando cita:", error);
    return res.status(500).json({ message: "No se pudo crear la cita." });
  }
});

app.patch("/api/agenda/citas/:id/confirmar", requireAuth, requireStaff, async (req, res) => {
  try {
    // Secretary may reschedule to an available time while confirming.
    const { doctorId, fecha, hora } = req.body || {};

    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!appointment) return res.status(404).json({ message: "Cita no encontrada." });

    const data = {
      status: "SCHEDULED",
      doctorId: doctorId || appointment.doctorId || null,
    };
    if (fecha && hora) data.scheduledAt = parseFechaHora(fecha, hora);

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data,
      include: appointmentInclude,
    });

    await enviarCorreoCitaEstado({ appointment: updated, tipo: "confirmada" });

    return res.json(serializeAppointment(updated));
  } catch (error) {
    console.error("Error confirmando cita:", error);
    return res.status(500).json({ message: "No se pudo confirmar la cita." });
  }
});

app.patch("/api/agenda/citas/:id/cancelar", requireAuth, requireStaff, async (req, res) => {
  try {
    const { motivo } = req.body || {};

    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!appointment) return res.status(404).json({ message: "Cita no encontrada." });

    // A still-pending request being turned down reads as a rejection;
    // an already-confirmed cita being dropped reads as a cancellation.
    const tipo = appointment.status === "REQUESTED" ? "rechazada" : "cancelada";

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELLED" },
      include: appointmentInclude,
    });

    await enviarCorreoCitaEstado({ appointment: updated, tipo, motivo });

    return res.json(serializeAppointment(updated));
  } catch (error) {
    console.error("Error cancelando cita:", error);
    return res.status(500).json({ message: "No se pudo cancelar la cita." });
  }
});

app.patch("/api/agenda/citas/:id/completar", requireAuth, requireStaff, async (req, res) => {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id, deletedAt: null },
    });
    if (!appointment) return res.status(404).json({ message: "Cita no encontrada." });

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "COMPLETED" },
      include: appointmentInclude,
    });

    return res.json(serializeAppointment(updated));
  } catch (error) {
    console.error("Error completando cita:", error);
    return res.status(500).json({ message: "No se pudo completar la cita." });
  }
});

// Doctor's own schedule — confirmed/completed appointments assigned to them.
app.get("/api/mi-agenda", requireAuth, requireClinical, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: req.user.id,
        deletedAt: null,
        status: { in: ["SCHEDULED", "COMPLETED"] },
      },
      include: appointmentInclude,
      orderBy: { scheduledAt: "asc" },
    });

    return res.json(appointments.map(serializeAppointment));
  } catch (error) {
    console.error("Error loading mi agenda:", error);
    return res.status(500).json({ message: "No se pudo cargar tu agenda." });
  }
});

// =============================
// CLIENT PORTAL (scoped to the logged-in client)
// =============================
app.get("/api/portal/mascotas", requireAuth, requireClient, async (req, res) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { clientId: req.user.client_id, deletedAt: null },
      orderBy: { name: "asc" },
    });

    return res.json(
      pets.map((p) => ({
        id: p.id,
        nombre: p.name,
        especie: p.species,
        raza: p.breed,
        sexo: p.sex,
        edad: p.ageYears,
        peso: p.weightKg,
        weight_text: p.weightText,
        observaciones: p.observations,
      }))
    );
  } catch (error) {
    console.error("Error cargando mascotas del portal:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

// The logged-in client registers one of their own pets.
app.post("/api/portal/mascotas", requireAuth, requireClient, async (req, res) => {
  try {
    const { nombre, especie, raza, sexo, edad, peso, observaciones } = req.body;

    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ message: "El nombre de la mascota es requerido." });
    }

    let sexValue = "UNKNOWN";
    if (sexo === "Macho" || sexo === "MALE") sexValue = "MALE";
    if (sexo === "Hembra" || sexo === "FEMALE") sexValue = "FEMALE";

    let speciesValue = null;
    if (especie === "Perro" || especie === "CANINE") speciesValue = "CANINE";
    if (especie === "Gato" || especie === "FELINE") speciesValue = "FELINE";

    const pet = await prisma.pet.create({
      data: {
        clientId: req.user.client_id,
        name: String(nombre).trim(),
        species: speciesValue,
        breed: raza ? String(raza).trim() : null,
        sex: sexValue,
        ageYears: edad ? Number(edad) : null,
        weightKg: peso ? Number(peso) : null,
        weightText: peso ? String(peso) : null,
        observations: observaciones ? String(observaciones).trim() : null,
      },
    });

    return res.status(201).json({
      id: pet.id,
      nombre: pet.name,
      especie: pet.species,
      raza: pet.breed,
      sexo: pet.sex,
      edad: pet.ageYears,
      peso: pet.weightKg,
      weight_text: pet.weightText,
      observaciones: pet.observations,
    });
  } catch (error) {
    console.error("Error creando mascota del portal:", error);
    return res.status(500).json({ message: "No se pudo registrar la mascota." });
  }
});

app.get("/api/portal/mascotas/:id", requireAuth, requireClient, async (req, res) => {
  try {
    const pet = await prisma.pet.findFirst({
      where: { id: req.params.id, clientId: req.user.client_id, deletedAt: null },
    });

    if (!pet) {
      return res.status(404).json({ message: "Mascota no encontrada." });
    }

    const vaccinations = await prisma.vaccination.findMany({
      where: {
        deletedAt: null,
        consultation: { petId: pet.id, clientId: req.user.client_id, deletedAt: null },
      },
      include: { consultation: { select: { fecha: true } } },
    });

    const carnet = vaccinations
      .map((v) => ({
        vacuna: v.vacuna,
        fecha_aplicacion: v.fechaAplicacion,
        fecha_refuerzo: v.fechaRefuerzo,
        lote: v.lote,
        laboratorio: v.laboratorio,
        veterinario: v.veterinario,
        lote_observaciones: v.loteObservaciones,
        fecha_consulta: v.consultation.fecha,
      }))
      .sort(
        (a, b) =>
          new Date(b.fecha_aplicacion || b.fecha_consulta) -
          new Date(a.fecha_aplicacion || a.fecha_consulta)
      );

    return res.json({
      id: pet.id,
      nombre: pet.name,
      especie: pet.species,
      raza: pet.breed,
      sexo: pet.sex,
      edad: pet.ageYears,
      peso: pet.weightKg,
      weight_text: pet.weightText,
      observaciones: pet.observations,
      carnet,
    });
  } catch (error) {
    console.error("Error cargando mascota del portal:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.get(
  "/api/portal/mascotas/:id/consultas",
  requireAuth,
  requireClient,
  async (req, res) => {
    try {
      const owned = await prisma.pet.findFirst({
        where: { id: req.params.id, clientId: req.user.client_id, deletedAt: null },
        select: { id: true },
      });
      if (!owned) {
        return res.status(404).json({ message: "Mascota no encontrada." });
      }

      const consultas = await getConsultasByPet(req.params.id);
      return res.json(consultas);
    } catch (error) {
      console.error("Error cargando historial del portal:", error);
      return res.status(500).json({ message: "Error interno del servidor." });
    }
  }
);

app.get("/api/portal/perfil", requireAuth, requireClient, async (req, res) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.user.client_id, deletedAt: null },
    });

    if (!client) {
      return res.status(404).json({ message: "Perfil no encontrado." });
    }

    return res.json({
      id: client.id,
      first_name: client.firstName,
      last_name: client.lastName,
      email: client.email,
      phone_primary: client.phonePrimary,
      phone_secondary: client.phoneSecondary,
      address_line1: client.addressLine1,
      profile_photo_url: client.profilePhotoUrl,
    });
  } catch (error) {
    console.error("Error cargando perfil del portal:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.post(
  "/api/portal/perfil/foto",
  requireAuth,
  requireClient,
  uploadAvatar.single("foto"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Selecciona una imagen." });
      }

      const publicUrl = `/uploads/avatars/${req.file.filename}`;

      await prisma.client.update({
        where: { id: req.user.client_id },
        data: { profilePhotoUrl: publicUrl },
      });

      return res.json({ profile_photo_url: publicUrl });
    } catch (error) {
      console.error("Error subiendo foto de perfil:", error);
      return res.status(500).json({ message: error.message || "No se pudo subir la foto." });
    }
  }
);

// Citas — client-created requests, always start PENDIENTE (REQUESTED).
app.get("/api/portal/citas", requireAuth, requireClient, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { clientId: req.user.client_id, deletedAt: null },
      include: { pet: true, appointmentType: true },
      orderBy: { scheduledAt: "desc" },
    });

    return res.json(appointments.map(serializeAppointment));
  } catch (error) {
    console.error("Error loading citas del portal:", error);
    return res.status(500).json({ message: "No se pudieron cargar tus citas." });
  }
});

app.post("/api/portal/citas", requireAuth, requireClient, async (req, res) => {
  try {
    const { mascotaId, servicio, prioridad, fecha, hora, motivo, mascotaAgresiva } = req.body;

    if (!mascotaId || !servicio || !fecha || !hora) {
      return res.status(400).json({ message: "Complete mascota, servicio, fecha y hora." });
    }

    const pet = await prisma.pet.findFirst({
      where: { id: mascotaId, clientId: req.user.client_id, deletedAt: null },
      select: { id: true },
    });
    if (!pet) return res.status(404).json({ message: "Mascota no encontrada." });

    const appointmentType = await prisma.appointmentType.findFirst({
      where: { name: servicio, deletedAt: null },
    });
    if (!appointmentType) return res.status(400).json({ message: "Servicio no válido." });

    const isPetAggressive = Boolean(mascotaAgresiva);
    const estimatedPrice = await computeEstimatedPrice(appointmentType, isPetAggressive);

    const appointment = await prisma.appointment.create({
      data: {
        petId: pet.id,
        clientId: req.user.client_id,
        appointmentTypeId: appointmentType.id,
        scheduledAt: parseFechaHora(fecha, hora),
        status: "REQUESTED",
        priority: PRIORIDAD_TO_DB[prioridad] || "NORMAL",
        notes: motivo || null,
        isPetAggressive,
        estimatedPrice,
      },
      include: { pet: true, appointmentType: true },
    });

    return res.status(201).json(serializeAppointment(appointment));
  } catch (error) {
    console.error("Error creando cita del portal:", error);
    return res.status(500).json({ message: "No se pudo enviar la solicitud." });
  }
});

app.patch("/api/portal/citas/:id/cancelar", requireAuth, requireClient, async (req, res) => {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id: req.params.id, clientId: req.user.client_id, deletedAt: null },
    });
    if (!appointment) return res.status(404).json({ message: "Cita no encontrada." });

    if (
      !["REQUESTED", "SCHEDULED"].includes(appointment.status) ||
      appointment.scheduledAt < new Date()
    ) {
      return res.status(400).json({ message: "Esta cita ya no se puede cancelar." });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: "CANCELLED" },
      include: { pet: true, appointmentType: true },
    });

    return res.json(serializeAppointment(updated));
  } catch (error) {
    console.error("Error cancelando cita del portal:", error);
    return res.status(500).json({ message: "No se pudo cancelar la cita." });
  }
});

cron.schedule("*/10 * * * *", async () => {
  console.log("Revisando consultas atrasadas y citas de mañana para enviar correos...");
  await enviarCorreosConsultasAtrasadas();
  await enviarCorreosConsultasManana();
});

app.get("/{*any}", (req, res) => {
  res.sendFile("index.html", { root: distPath });
});

// =============================
// SERVER
// =============================
const PORT = process.env.PORT || 5000;

enviarCorreosConsultasAtrasadas();
enviarCorreosConsultasManana();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

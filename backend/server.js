import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import crypto from "crypto";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import cron from "node-cron";
import prisma from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (origin.startsWith("http://localhost")) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
  })
);

app.use(express.json());

const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

app.get("/test", (req, res) => {
  res.json({ ok: true, message: "backend funcionando correctamente" });
});

app.get("/test-neon", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        NOW() AS server_time
    `;

    res.json({
      ok: true,
      message: "Backend conectado correctamente con Neon mediante Prisma",
      database: result[0],
    });
  } catch (error) {
    console.error("Error comprobando Neon:", error);

    res.status(500).json({
      ok: false,
      message: "No se pudo conectar con Neon",
    });
  }
});

app.use(express.json());

const uploadsBaseDir = path.join(__dirname, "uploads");
const consultasUploadsDir = path.join(uploadsBaseDir, "consultas");

if (!fs.existsSync(uploadsBaseDir)) {
  fs.mkdirSync(uploadsBaseDir, { recursive: true });
}

if (!fs.existsSync(consultasUploadsDir)) {
  fs.mkdirSync(consultasUploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsBaseDir));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadBufferToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "vetcare/consultas",
        resource_type: "auto",
        public_id: `${Date.now()}-${crypto.randomUUID()}`,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10,
  },
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const mailTransporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: String(process.env.MAIL_SECURE).toLowerCase() === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

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
        "Le recomendamos comunicarse con la clÃ­nica a la mayor brevedad para reprogramar la cita y dar continuidad a la atenciÃ³n mÃ©dica.",
      fieldLabel: "Fecha registrada",
      fieldValue: formatDateForEmail(row.proxima_cita),
      notifiedColumn: "atraso_notificado_at",
      logLabel: "consulta atrasada",
    };
  }

  if (tipo === "manana") {
    return {
      subject: `Recordatorio de cita programada - ${row.mascota_nombre}`,
      title: "Recordatorio de cita para maÃ±ana",
      message: `Le recordamos que su mascota <strong>${row.mascota_nombre}</strong> tiene una cita programada para maÃ±ana en nuestra veterinaria.`,
      footer:
        "En caso de no poder asistir en el horario indicado, por favor comunÃ­quese con nosotros con anticipaciÃ³n para ayudarle a reprogramar.",
      fieldLabel: "Fecha y hora de la cita",
      fieldValue: formatDateForEmail(row.proxima_cita),
      notifiedColumn: "recordatorio_manana_enviado_at",
      logLabel: "cita de maÃ±ana",
    };
  }

  throw new Error(`Tipo de recordatorio no soportado: ${tipo}`);
}

async function enviarCorreoConsulta({
  connection,
  row,
  tipo,
  marcarNotificado = true,
}) {
  const config = getReminderConfig(tipo, row);

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f5f7fa; padding:24px;">
      <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">

        <div style="padding:28px 32px 10px; text-align:center;">
          <img src="cid:logoVerde" width="72" alt="VetCare" style="display:block; margin:0 auto 12px;" />
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
            <p style="margin:0;">Este es un mensaje automÃ¡tico del sistema de recordatorios.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  await mailTransporter.sendMail({
    from: process.env.MAIL_FROM,
    to: row.cliente_correo,
    subject: config.subject,
    html,
    attachments: [
      {
        filename: "logo-verde.png",
        path: path.join(__dirname, "../public/logo-verde.png"),
        cid: "logoVerde",
      },
    ],
  });

  if (marcarNotificado) {
    await connection.execute(
      `
      UPDATE consultas
      SET ${config.notifiedColumn} = NOW(),
          updated_at = NOW()
      WHERE id = ?
      `,
      [row.id]
    );
  }

  console.log(
    `Correo enviado por ${config.logLabel}. Consulta: ${row.id}, email: ${row.cliente_correo}`
  );
}

async function enviarCorreosConsultasManana() {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `
      SELECT
        c.id,
        c.fecha,
        c.proxima_cita,
        c.motivo,
        c.estado,
        c.client_id,
        cl.email AS cliente_correo,
        CONCAT(cl.first_name, ' ', cl.last_name) AS cliente_nombre,
        p.name AS mascota_nombre
      FROM consultas c
      INNER JOIN clients cl ON cl.id = c.client_id
      INNER JOIN pets p ON p.id = c.pet_id
      WHERE c.deleted_at IS NULL
        AND cl.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND c.proxima_cita IS NOT NULL
        AND DATE(c.proxima_cita) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        AND c.recordatorio_manana_enviado_at IS NULL
        AND cl.email IS NOT NULL
        AND TRIM(cl.email) <> ''
      ORDER BY c.proxima_cita ASC
      `
    );

    for (const row of rows) {
      try {
        await enviarCorreoConsulta({
          connection,
          row,
          tipo: "manana",
          marcarNotificado: true,
        });

        console.log(`Correo de cita para maÃ±ana enviado. Consulta: ${row.id}`);
      } catch (mailError) {
        console.error(`Error enviando correo de maÃ±ana ${row.id}:`, mailError);
      }
    }
  } catch (error) {
    console.error("Error revisando citas de maÃ±ana:", error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

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
      message: "Token invÃ¡lido o expirado.",
    });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Acceso denegado. Solo administradores.",
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
      "Demasiados intentos de inicio de sesiÃ³n. Intenta dentro de 15 minutos.",
  },
});



app.use("/api", apiLimiter);

// =============================
// ROOT
// =============================

// =============================
// TEST ROUTE
// =============================
app.get("/test", (req, res) => {
  res.json({
    ok: true,
    message: "backend funcionando correctamente",
  });
});

// =============================
// REGISTER CLIENT - PRISMA / NEON
// =============================
app.post("/api/clientes", requireAuth, async (req, res) => {
  try {
    const {
      nombre,
      cedula,
      direccion,
      correo,
      telefono,
      telefono2,
    } = req.body;

    const cleanNombre = String(nombre || "").trim();
    const cleanCedula = String(cedula || "").trim();
    const cleanDireccion = String(direccion || "").trim();
    const cleanCorreo = String(correo || "").trim().toLowerCase();
    const cleanTelefono = String(telefono || "").trim();
    const cleanTelefono2 = String(telefono2 || "").trim();

    if (
      !cleanNombre ||
      !cleanCedula ||
      !cleanDireccion ||
      !cleanCorreo ||
      !cleanTelefono
    ) {
      return res.status(400).json({
        message: "Complete todos los campos requeridos",
      });
    }

    const existingClient = await prisma.client.findFirst({
      where: {
        nationalId: cleanCedula,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (existingClient) {
      return res.status(409).json({
        message: "Ya existe un cliente con dicha cÃ©dula",
      });
    }

    const nameParts = cleanNombre.split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";

    const client = await prisma.client.create({
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

    return res.status(201).json({
      message: "Usuario guardado exitosamente",
      client: {
        id: client.id,
        nombre: `${client.firstName} ${client.lastName}`.trim(),
        cedula: client.nationalId,
        direccion: client.addressLine1,
        correo: client.email,
        telefono: client.phonePrimary,
        telefono2: client.phoneSecondary,
      },
    });
  } catch (error) {
    console.error("Error saving client with Prisma:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        message: "Ya existe un cliente con esa cÃ©dula.",
      });
    }

    return res.status(500).json({
      message: "OcurriÃ³ un error al guardar el cliente.",
    });
  }
});
// =============================
// GET CLIENTS - PRISMA / NEON
// =============================
app.get("/api/clientes", requireAuth, async (req, res) => {
  try {
    const { id, estado } = req.query;

    const where = {};

    if (id) {
      where.id = String(id);
    }

    if (estado === "activo") {
      where.deletedAt = null;
    }

    if (estado === "inactivo") {
      where.deletedAt = {
        not: null,
      };
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: [
        {
          firstName: "asc",
        },
        {
          lastName: "asc",
        },
      ],
    });

    const response = clients.map((client) => ({
      id: client.id,
      nombre: `${client.firstName} ${client.lastName}`.trim(),
      cedula: client.nationalId,
      direccion: client.addressLine1,
      correo: client.email,
      telefono: client.phonePrimary,
      telefono2: client.phoneSecondary,
      estado: client.deletedAt === null ? "activo" : "inactivo",
    }));

    return res.json(response);
  } catch (error) {
    console.error("Error loading clients with Prisma:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
});


//DB de azure

app.get("/db-check", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT NOW() AS now_time");
    res.json({ ok: true, rows });
  } catch (error) {
    console.error("DB CHECK ERROR:", error);
    res.status(500).json({
      ok: false,
      message: error.message,
      code: error.code || null,
      sqlMessage: error.sqlMessage || null,
    });
  }
});














// =============================
// REGISTER PET - PRISMA / NEON
// =============================
app.post("/api/mascotas", requireAuth, async (req, res) => {
  try {
    const {
      clienteId,
      nombre,
      edad,
      raza,
      sexo,
      peso,
      observaciones,
    } = req.body;

    const cleanClienteId = String(clienteId || "").trim();
    const cleanNombre = String(nombre || "").trim();
    const cleanRaza = String(raza || "").trim();
    const cleanSexo = String(sexo || "").trim();
    const cleanObservaciones = String(observaciones || "").trim();

    if (
      !cleanClienteId ||
      !cleanNombre ||
      !edad ||
      !cleanRaza ||
      !cleanSexo ||
      !peso
    ) {
      return res.status(400).json({
        message: "Complete todos los campos obligatorios.",
      });
    }

    const ageYears = Number.parseInt(edad, 10);
    const weightKg = Number.parseFloat(peso);

    if (!Number.isInteger(ageYears) || ageYears < 0) {
      return res.status(400).json({
        message: "La edad de la mascota no es vÃ¡lida.",
      });
    }

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      return res.status(400).json({
        message: "El peso de la mascota no es vÃ¡lido.",
      });
    }

    const client = await prisma.client.findFirst({
      where: {
        id: cleanClienteId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!client) {
      return res.status(404).json({
        message: "Usuario no encontrado.",
      });
    }

    let sexValue = "UNKNOWN";

    if (
      cleanSexo.toLowerCase() === "macho" ||
      cleanSexo.toUpperCase() === "MALE"
    ) {
      sexValue = "MALE";
    }

    if (
      cleanSexo.toLowerCase() === "hembra" ||
      cleanSexo.toUpperCase() === "FEMALE"
    ) {
      sexValue = "FEMALE";
    }

    const pet = await prisma.pet.create({
      data: {
        clientId: cleanClienteId,
        name: cleanNombre,
        breed: cleanRaza,
        sex: sexValue,
        ageYears,
        weightKg,
        weightText: String(peso),
        observations: cleanObservaciones || null,
      },
      select: {
        id: true,
        name: true,
        clientId: true,
      },
    });

    return res.status(201).json({
      message: "Mascota guardada exitosamente.",
      pet: {
        id: pet.id,
        nombre: pet.name,
        clienteId: pet.clientId,
      },
    });
  } catch (error) {
    console.error("Error guardando mascota con Prisma:", error);

    if (error.code === "P2003") {
      return res.status(400).json({
        message: "El usuario seleccionado no existe.",
      });
    }

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
});

app.put("/api/clientes/:id/toggle", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT id, deleted_at FROM clients WHERE id = ? LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    const cliente = rows[0];

    if (cliente.deleted_at === null) {
      await pool.execute(`UPDATE clients SET deleted_at = NOW() WHERE id = ?`, [id]);
    } else {
      await pool.execute(`UPDATE clients SET deleted_at = NULL WHERE id = ?`, [id]);
    }

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
    const [rows] = await pool.execute(
      `
      SELECT id
      FROM clients
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
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

    const [existingCedula] = await pool.execute(
      `
      SELECT id
      FROM clients
      WHERE national_id = ?
        AND id <> ?
      LIMIT 1
      `,
      [cleanCedula, id]
    );

    if (existingCedula.length > 0) {
      return res.status(409).json({
        message: "Ya existe otro usuario con esa cÃ©dula",
      });
    }

    const [existingCorreo] = await pool.execute(
      `
      SELECT id
      FROM clients
      WHERE email = ?
        AND id <> ?
      LIMIT 1
      `,
      [cleanCorreo, id]
    );

    if (existingCorreo.length > 0) {
      return res.status(409).json({
        message: "Ya existe otro cliente con ese correo",
      });
    }

    const nameParts = cleanNombre.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "-";

    await pool.execute(
      `
      UPDATE clients
      SET
        first_name = ?,
        last_name = ?,
        national_id = ?,
        email = ?,
        phone_primary = ?,
        phone_secondary = ?,
        address_line1 = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        firstName,
        lastName,
        cleanCedula,
        cleanCorreo,
        cleanTelefono,
        cleanTelefono2 || null,
        cleanDireccion,
        id,
      ]
    );

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
// GET PETS - PRISMA / NEON
// =============================
app.get("/api/mascotas", requireAuth, async (req, res) => {
  try {
    const { id, clienteId, estado } = req.query;

    const where = {};

    if (id) {
      where.id = String(id);
    }

    if (clienteId) {
      where.clientId = String(clienteId);
    }

    if (estado === "activo") {
      where.deletedAt = null;
    }

    if (estado === "inactivo") {
      where.deletedAt = {
        not: null,
      };
    }

    const pets = await prisma.pet.findMany({
      where,
      include: {
        client: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const response = pets.map((pet) => {
      const peso =
        pet.weightKg === null || pet.weightKg === undefined
          ? null
          : Number(pet.weightKg);

      return {
        id: pet.id,

        clienteId: pet.clientId,
        client_id: pet.clientId,

        nombre: pet.name,
        name: pet.name,

        raza: pet.breed || "",
        breed: pet.breed || "",

        edad: pet.ageYears,
        age_years: pet.ageYears,

        sexo: pet.sex || "",

        peso,
        weight_kg: peso,
        weight_text: pet.weightText || "",

        observaciones: pet.observations || "",

        first_name: pet.client?.firstName || "",
        last_name: pet.client?.lastName || "",

        propietario: [
          pet.client?.firstName,
          pet.client?.lastName,
        ]
          .filter(Boolean)
          .join(" "),

        estado: pet.deletedAt === null ? "activo" : "inactivo",
      };
    });

    return res.json(response);
  } catch (error) {
    console.error("ERROR GET /api/mascotas:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
      detail: error.message,
      code: error.code || null,
    });
  }
});

// =============================
// TOGGLE PET STATUS - PRISMA / NEON
// =============================
app.put("/api/mascotas/:id/toggle", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const pet = await prisma.pet.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!pet) {
      return res.status(404).json({
        message: "Mascota no encontrada.",
      });
    }

    const newDeletedAt = pet.deletedAt === null ? new Date() : null;

    const updatedPet = await prisma.pet.update({
      where: {
        id,
      },
      data: {
        deletedAt: newDeletedAt,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    return res.json({
      message:
        updatedPet.deletedAt === null
          ? "Mascota activada correctamente."
          : "Mascota desactivada correctamente.",
      estado: updatedPet.deletedAt === null ? "activo" : "inactivo",
    });
  } catch (error) {
    console.error("Error toggling pet with Prisma:", error);

    return res.status(500).json({
      message: "Error actualizando el estado de la mascota.",
    });
  }
});

// =============================
// UPDATE PET - PRISMA / NEON
// =============================
app.put("/api/mascotas/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      edad,
      raza,
      sexo,
      peso,
      observaciones,
    } = req.body;

    const pet = await prisma.pet.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!pet) {
      return res.status(404).json({
        message: "Mascota no encontrada.",
      });
    }

    const cleanNombre = String(nombre || "").trim();
    const cleanRaza = String(raza || "").trim();
    const cleanSexo = String(sexo || "").trim();
    const cleanObservaciones = String(observaciones || "").trim();

    const ageYears =
      edad === "" || edad === null || edad === undefined
        ? null
        : Number.parseInt(edad, 10);

    const weightKg =
      peso === "" || peso === null || peso === undefined
        ? null
        : Number.parseFloat(peso);

    if (!cleanNombre) {
      return res.status(400).json({
        message: "El nombre de la mascota es obligatorio.",
      });
    }

    if (
      ageYears !== null &&
      (!Number.isInteger(ageYears) || ageYears < 0)
    ) {
      return res.status(400).json({
        message: "La edad de la mascota no es vÃ¡lida.",
      });
    }

    if (
      weightKg !== null &&
      (!Number.isFinite(weightKg) || weightKg <= 0)
    ) {
      return res.status(400).json({
        message: "El peso de la mascota no es vÃ¡lido.",
      });
    }

    let sexValue = "UNKNOWN";

    if (
      cleanSexo.toLowerCase() === "macho" ||
      cleanSexo.toUpperCase() === "MALE"
    ) {
      sexValue = "MALE";
    }

    if (
      cleanSexo.toLowerCase() === "hembra" ||
      cleanSexo.toUpperCase() === "FEMALE"
    ) {
      sexValue = "FEMALE";
    }

    const updatedPet = await prisma.pet.update({
      where: {
        id,
      },
      data: {
        name: cleanNombre,
        breed: cleanRaza || null,
        sex: sexValue,
        ageYears,
        weightKg,
        weightText: weightKg === null ? null : String(peso),
        observations: cleanObservaciones || null,
      },
      select: {
        id: true,
        name: true,
        breed: true,
        sex: true,
        ageYears: true,
        weightKg: true,
        observations: true,
      },
    });

    return res.json({
      message: "Mascota actualizada correctamente.",
      pet: {
        id: updatedPet.id,
        nombre: updatedPet.name,
        raza: updatedPet.breed,
        sexo: updatedPet.sex,
        edad: updatedPet.ageYears,
        peso:
          updatedPet.weightKg === null
            ? null
            : Number(updatedPet.weightKg),
        observaciones: updatedPet.observations,
      },
    });
  } catch (error) {
    console.error("Error updating pet with Prisma:", error);

    return res.status(500).json({
      message: "Error actualizando mascota.",
    });
  }
});

// =============================
// GET DOCTORS - PRISMA / NEON
// =============================
app.get("/api/doctores", requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
      orderBy: {
        username: "asc",
      },
    });

    const allowedRoles = new Set([
      "ADMIN",
      "DOCTOR",
      "VETERINARIO",
      "VETERINARIAN",
      "VET",
    ]);

    const doctors = users
      .filter((user) =>
        allowedRoles.has(String(user.role || "").trim().toUpperCase())
      )
      .map((user) => ({
        id: user.id,
        nombre: user.username,
        role: user.role,
      }));

    return res.json(doctors);
  } catch (error) {
    console.error("Error loading doctors with Prisma:", error);

    return res.status(500).json({
      message: "Error interno al cargar los doctores.",
      detail: error.message,
      code: error.code || null,
    });
  }
});

// =============================
// GET CONSULTATION TYPES
// =============================
app.get("/api/tipos-consulta", requireAuth, async (req, res) => {
  const tipos = [
    {
      id: "gen",
      codigo: "gen",
      nombre: "Consulta general",
    },
    {
      id: "rou",
      codigo: "rou",
      nombre: "Control rutinario",
    },
    {
      id: "vac",
      codigo: "vac",
      nombre: "VacunaciÃ³n",
    },
    {
      id: "ill",
      codigo: "ill",
      nombre: "Enfermedad",
    },
    {
      id: "eme",
      codigo: "eme",
      nombre: "Emergencia",
    },
    {
      id: "sur",
      codigo: "sur",
      nombre: "CirugÃ­a",
    },
    {
      id: "med",
      codigo: "med",
      nombre: "MedicaciÃ³n",
    },
    {
      id: "den",
      codigo: "den",
      nombre: "Consulta dental",
    },
    {
      id: "emb",
      codigo: "emb",
      nombre: "Embarazo",
    },
  ];

  return res.json(tipos);
});

// =============================
// STATS - PRISMA / NEON
// =============================
app.get("/api/stats", requireAuth, async (req, res) => {
  try {
    const limiteAlertas = new Date();
    limiteAlertas.setDate(limiteAlertas.getDate() + 3);

    const [clientes, mascotas, consultas, alertas] = await Promise.all([
      prisma.client.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.pet.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.consultation.count({
        where: {
          deletedAt: null,
        },
      }),

      prisma.consultation.count({
        where: {
          deletedAt: null,
          OR: [
            {
              proximaCita: {
                not: null,
                lte: limiteAlertas,
              },
            },
            {
              estado: "seguimiento",
            },
          ],
        },
      }),
    ]);

    return res.json({
      clientes,
      mascotas,
      consultas,
      alertas,
    });
  } catch (error) {
    console.error("Error loading stats with Prisma:", error);

    return res.status(500).json({
      message: "Error interno al cargar estadÃ­sticas.",
      error: error.message,
    });
  }
});

// =============================
// ALERTAS
// =============================
app.get("/api/alertas", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        c.id,
        c.pet_id,
        c.client_id,
        c.doctor_id,
        c.fecha,
        c.proxima_cita,
        cl.email AS cliente_correo,
        c.motivo,
        c.diagnostico,
        c.observaciones,
        c.estado,
        c.gravedad,

        p.name AS mascota_nombre,
        p.breed AS mascota_raza,

        CONCAT(cl.first_name, ' ', cl.last_name) AS cliente_nombre,
        cl.phone_primary AS cliente_telefono,

        d.full_name AS doctor_nombre
      FROM consultas c
      INNER JOIN pets p
        ON p.id = c.pet_id
      INNER JOIN clients cl
        ON cl.id = c.client_id
      LEFT JOIN doctors d
        ON d.id = c.doctor_id
      WHERE c.deleted_at IS NULL
        AND (
          c.estado = 'seguimiento'
          OR c.proxima_cita IS NOT NULL
        )
      ORDER BY
        CASE
          WHEN c.proxima_cita IS NULL THEN 1
          ELSE 0
        END,
        c.proxima_cita ASC,
        c.created_at DESC
    `);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const alertas = rows.map((row) => {
      let categoria = "proximas";

      if (row.proxima_cita) {
        const cita = new Date(row.proxima_cita);
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
      } else if (row.estado === "seguimiento") {
        categoria = "proximas";
      }

      return {
        id: row.id,
        pet_id: row.pet_id,
        client_id: row.client_id,
        doctor_id: row.doctor_id,
        fecha: row.fecha,
        proxima_cita: row.proxima_cita,
        motivo: row.motivo,
        diagnostico: row.diagnostico,
        observaciones: row.observaciones,
        estado: row.estado,
        gravedad: row.gravedad,
        mascota_nombre: row.mascota_nombre,
        mascota_raza: row.mascota_raza,
        cliente_nombre: row.cliente_nombre,
        cliente_telefono: row.cliente_telefono,
        doctor_nombre: row.doctor_nombre,
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

    return res.json({
      resumen,
      alertas,
    });
  } catch (error) {
    console.error("Error loading alertas:", error);

    return res.status(500).json({
      message: "No se pudieron cargar las alertas.",
      error: error.message,
      sqlMessage: error.sqlMessage || null,
      code: error.code || null,
    });
  }
});

app.put("/api/alertas/:id/quitar", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const [exists] = await pool.execute(
      `
      SELECT id, estado
      FROM consultas
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );

    if (exists.length === 0) {
      return res.status(404).json({
        message: "Alerta no encontrada.",
      });
    }

    await pool.execute(
      `
      UPDATE consultas
      SET
        proxima_cita = NULL,
        motivo_seguimiento = NULL,
        estado = CASE
          WHEN estado = 'seguimiento' THEN 'cerrada'
          ELSE estado
        END,
        updated_at = NOW()
      WHERE id = ?
      `,
      [id]
    );

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

// ===============================================
// CREATE CONSULTATION - PRISMA / NEON / CLOUDINARY
// ===============================================
app.post(
  "/api/consultas",
  requireAuth,
  upload.array("adjuntos", 10),
  async (req, res) => {
    const uploadedAssets = [];

    const cleanText = (value) => {
      const text = String(value ?? "").trim();
      return text || null;
    };

    const parseInteger = (value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      const number = Number.parseInt(value, 10);
      return Number.isInteger(number) ? number : null;
    };

    const parseDecimal = (value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      const number = Number(value);
      return Number.isFinite(number) ? String(number) : null;
    };

    const parseDateValue = (value) => {
      if (!value) return null;

      const text = String(value).trim();

      const normalized =
        /^\d{4}-\d{2}-\d{2}$/.test(text)
          ? `${text}T00:00:00`
          : text.includes(" ")
            ? text.replace(" ", "T")
            : text;

      const date = new Date(normalized);

      return Number.isNaN(date.getTime()) ? null : date;
    };

    const parseVisitDate = (dateValue, timeValue) => {
      if (!dateValue) return null;

      const cleanDate = String(dateValue).trim();
      const cleanTime = String(timeValue || "").trim();

      if (cleanDate.includes("T") || cleanDate.includes(" ")) {
        return parseDateValue(cleanDate);
      }

      let completeTime = "00:00:00";

      if (cleanTime) {
        completeTime =
          /^\d{2}:\d{2}$/.test(cleanTime)
            ? `${cleanTime}:00`
            : cleanTime;
      }

      return parseDateValue(`${cleanDate}T${completeTime}`);
    };

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
        observaciones_embarazo,
      } = req.body;

      const petId = cleanText(pet_id);
      const clientId = cleanText(client_id);
      const doctorInput = cleanText(doctor_id);
      const motivoValue = cleanText(motivo);
      const fechaHora = parseVisitDate(fecha, hora);

      if (
        !petId ||
        !clientId ||
        !doctorInput ||
        !fechaHora ||
        !motivoValue
      ) {
        return res.status(400).json({
          message:
            "Faltan campos obligatorios o la fecha de la consulta no es vÃ¡lida.",
        });
      }

      const tiposConsulta = [
        ...new Set(
          parseJsonArray(req.body.tipos_consulta)
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        ),
      ];

      const medicaciones = parseJsonArray(req.body.medicaciones)
        .map((item) => String(item || "").trim())
        .filter(Boolean);

      const analisis = parseJsonArray(req.body.analisis)
        .map((item) => String(item || "").trim())
        .filter(Boolean);

      const vacunas = parseJsonArray(req.body.vacunas)
        .map((item) => String(item || "").trim())
        .filter(Boolean);

      const [pet, client, doctor] = await Promise.all([
        prisma.pet.findFirst({
          where: {
            id: petId,
            deletedAt: null,
          },
          select: {
            id: true,
            clientId: true,
          },
        }),

        prisma.client.findFirst({
          where: {
            id: clientId,
            deletedAt: null,
          },
          select: {
            id: true,
          },
        }),

        prisma.user.findFirst({
          where: {
            deletedAt: null,
            OR: [
              {
                id: doctorInput,
              },
              {
                username: doctorInput,
              },
            ],
          },
          select: {
            id: true,
            username: true,
          },
        }),
      ]);

      if (!pet) {
        return res.status(404).json({
          message: "La mascota seleccionada no existe o estÃ¡ inactiva.",
        });
      }

      if (!client) {
        return res.status(404).json({
          message: "El usuario seleccionado no existe o estÃ¡ inactivo.",
        });
      }

      if (pet.clientId !== client.id) {
        return res.status(400).json({
          message:
            "La mascota seleccionada no pertenece al usuario indicado.",
        });
      }

      if (!doctor) {
        return res.status(404).json({
          message: "El doctor seleccionado no existe.",
        });
      }

      /*
       * Primero se suben los archivos a Cloudinary.
       * TodavÃ­a no se abre la transacciÃ³n de PostgreSQL.
       */
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          const result = await uploadBufferToCloudinary(file);

          uploadedAssets.push({
            publicId: result.public_id,
            resourceType: result.resource_type || "image",
            secureUrl: result.secure_url,
            file,
          });
        }
      }

      /*
       * La consulta y todos sus registros relacionados
       * se guardan de forma atÃ³mica en Neon.
       */
      const consultation = await prisma.$transaction(async (tx) => {
        return tx.consultation.create({
          data: {
            petId: pet.id,
            clientId: client.id,
            doctorId: doctor.id,

            fecha: fechaHora,
            motivo: motivoValue,
            diagnostico: cleanText(diagnostico),
            observaciones: cleanText(observaciones),

            estado: cleanText(estado) || "abierta",
            gravedad: cleanText(gravedad) || "moderada",

            proximaCita: parseDateValue(proxima_cita),
            motivoSeguimiento: cleanText(motivo_seguimiento),

            peso: parseDecimal(weight),
            temperatura: parseDecimal(temp),
            frecuenciaCardiaca: parseInteger(hr),
            frecuenciaRespiratoria: parseInteger(rr),
            presionArterial: cleanText(bp),
            saturacionOxigeno: parseInteger(spo2),

            types:
              tiposConsulta.length > 0
                ? {
                    create: tiposConsulta.map((codigo) => ({
                      tipoConsultaId: codigo,
                    })),
                  }
                : undefined,

            pregnancy: tiposConsulta.includes("emb")
              ? {
                  create: {
                    mesesGestacion: parseInteger(meses_gestacion),
                    cantidadCrias: parseInteger(cantidad_crias),
                    riesgo: cleanText(riesgo_embarazo) || "bajo",
                    tipoParto: cleanText(tipo_parto),
                    fechaProbableParto:
                      parseDateValue(fecha_probable_parto),
                    observacionesEmbarazo:
                      cleanText(observaciones_embarazo),
                  },
                }
              : undefined,

            medications:
              medicaciones.length > 0
                ? {
                    create: medicaciones.map((medicamento) => ({
                      medicamento,
                      indicaciones: cleanText(notas_medicacion),
                    })),
                  }
                : undefined,

            analyses:
              analisis.length > 0
                ? {
                    create: analisis.map((analisisItem) => ({
                      analisis: analisisItem,
                      resultadoObservacion:
                        cleanText(notas_analisis),
                    })),
                  }
                : undefined,

            vaccinations:
              vacunas.length > 0
                ? {
                    create: vacunas.map((vacuna) => ({
                      vacuna,
                      loteObservaciones: cleanText(lote_vacuna),
                    })),
                  }
                : undefined,

            attachments:
              uploadedAssets.length > 0
                ? {
                    create: uploadedAssets.map((asset) => ({
                      nombreArchivo: asset.file.originalname,
                      rutaArchivo: asset.secureUrl,
                      tipoArchivo: asset.file.mimetype || null,
                      tamanoBytes: asset.file.size || null,
                      storageProvider: "cloudinary",
                      storageKey: asset.publicId,
                      publicUrl: asset.secureUrl,
                    })),
                  }
                : undefined,
          },

          select: {
            id: true,
            fecha: true,
            petId: true,
            clientId: true,
            doctorId: true,
            types: {
              select: {
                tipoConsultaId: true,
              },
            },
            attachments: {
              select: {
                nombreArchivo: true,
                publicUrl: true,
                storageKey: true,
              },
            },
          },
        });
      });

      return res.status(201).json({
        message: "Consulta guardada correctamente.",
        consulta: {
          id: consultation.id,
          pet_id: consultation.petId,
          client_id: consultation.clientId,
          doctor_id: consultation.doctorId,
          fecha: consultation.fecha,
          tipos_consulta: consultation.types.map(
            (tipo) => tipo.tipoConsultaId
          ),
          adjuntos: consultation.attachments.map((attachment) => ({
            nombre_archivo: attachment.nombreArchivo,
            public_url: attachment.publicUrl,
            storage_key: attachment.storageKey,
          })),
        },
      });
    } catch (error) {
      /*
       * Si Cloudinary recibiÃ³ archivos, pero PostgreSQL fallÃ³,
       * se eliminan esos archivos para evitar recursos huÃ©rfanos.
       */
      if (uploadedAssets.length > 0) {
        await Promise.allSettled(
          uploadedAssets.map((asset) =>
            cloudinary.uploader.destroy(asset.publicId, {
              resource_type: asset.resourceType,
            })
          )
        );
      }

      console.error(
        "Error saving consultation with Prisma and Cloudinary:",
        error
      );

      if (error.code === "P2003") {
        return res.status(400).json({
          message:
            "La mascota, el usuario o el doctor indicado no existe.",
          code: error.code,
        });
      }

      return res.status(500).json({
        message: "Error interno al guardar la consulta.",
        detail: error.message,
        code: error.code || null,
      });
    }
  }
);
// =============================
// CONSULTATION ID
// =============================
app.get("/api/consultas/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [consultas] = await pool.execute(
      `
      SELECT
        c.id,
        c.pet_id,
        c.client_id,
        c.doctor_id,
        c.fecha AS visit_at,
        c.motivo AS reason,
        c.diagnostico AS diagnosis,
        c.observaciones AS notes,
        c.estado,
        c.gravedad,
        c.proxima_cita,
        c.motivo_seguimiento,
        c.peso,
        c.temperatura,
        c.frecuencia_cardiaca,
        c.frecuencia_respiratoria,
        c.presion_arterial,
        c.saturacion_oxigeno,
        d.full_name AS doctor
      FROM consultas c
      LEFT JOIN doctors d
        ON d.id = c.doctor_id
      WHERE c.id = ?
        AND c.deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );

    if (consultas.length === 0) {
      return res.status(404).json({
        message: "Consulta no encontrada.",
      });
    }

    const consulta = consultas[0];

    const [tipos] = await pool.execute(
      `
      SELECT
        tc.id,
        tc.codigo,
        tc.nombre
      FROM consulta_tipos ct
      INNER JOIN tipos_consulta tc
        ON tc.id = ct.tipo_consulta_id
      WHERE ct.consulta_id = ?
        AND ct.deleted_at IS NULL
        AND tc.deleted_at IS NULL
      ORDER BY tc.nombre ASC
      `,
      [id]
    );

    const [medicaciones] = await pool.execute(
      `
      SELECT medicamento, indicaciones
      FROM consulta_medicaciones
      WHERE consulta_id = ?
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      `,
      [id]
    );

    const [analisis] = await pool.execute(
      `
      SELECT analisis, resultado_observacion
      FROM consulta_analisis
      WHERE consulta_id = ?
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      `,
      [id]
    );

    const [vacunas] = await pool.execute(
      `
      SELECT vacuna, lote_observaciones
      FROM consulta_vacunas
      WHERE consulta_id = ?
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      `,
      [id]
    );

    const [adjuntos] = await pool.execute(
      `
      SELECT nombre_archivo, ruta_archivo, tipo_archivo, tamano_bytes
      FROM consulta_adjuntos
      WHERE consulta_id = ?
        AND deleted_at IS NULL
      ORDER BY created_at ASC
      `,
      [id]
    );

    return res.json({
      ...consulta,
      tipos_consulta: tipos.map((t) => t.codigo),
      tipos_consulta_detalle: tipos,
      treatment:
        medicaciones.length > 0
          ? medicaciones.map((m) => m.medicamento).join(", ")
          : null,
      medicaciones,
      analisis,
      vacunas,
      adjuntos,
    });
  } catch (error) {
    console.error("Error loading consulta detail:", error);

    return res.status(500).json({
      message: "Error interno al cargar la consulta.",
      error: error.message,
      sqlMessage: error.sqlMessage || null,
      code: error.code || null,
    });
  }
});

app.put("/api/consultas/:id", requireAuth, async (req, res) => {
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
    const [exists] = await pool.execute(
      `
      SELECT id
      FROM consultas
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: "Consulta no encontrada." });
    }

    await pool.execute(
      `
      UPDATE consultas
      SET
        doctor_id = ?,
        pet_id = ?,
        client_id = ?,
        fecha = ?,
        motivo = ?,
        diagnostico = ?,
        observaciones = ?,
        estado = ?,
        gravedad = ?,
        proxima_cita = ?,
        motivo_seguimiento = ?,
        updated_at = NOW()
      WHERE id = ?
      `,
      [
        doctor_id || null,
        pet_id || null,
        client_id || null,
        fecha || null,
        motivo || null,
        diagnostico || null,
        observaciones || null,
        estado || null,
        gravedad || null,
        proxima_cita || null,
        motivo_seguimiento || null,
        id,
      ]
    );

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

app.delete("/api/consultas/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const [exists] = await pool.execute(
      `
      SELECT id
      FROM consultas
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
      `,
      [id]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: "Consulta no encontrada." });
    }

    await pool.execute(
      `
      UPDATE consultas
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ?
      `,
      [id]
    );

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

// ==========================================
// GET PET CLINICAL HISTORY - PRISMA / NEON
// ==========================================
app.get(
  "/api/mascotas/:mascotaId/consultas",
  requireAuth,
  async (req, res) => {
    try {
      const { mascotaId } = req.params;

      if (!mascotaId) {
        return res.status(400).json({
          message: "ID de mascota es requerido.",
        });
      }

      const pet = await prisma.pet.findUnique({
        where: {
          id: mascotaId,
        },
        select: {
          id: true,
        },
      });

      if (!pet) {
        return res.status(404).json({
          message: "Mascota no encontrada.",
        });
      }

      const consultas = await prisma.consultation.findMany({
        where: {
          petId: mascotaId,
          deletedAt: null,
        },
        include: {
          doctor: {
            select: {
              username: true,
            },
          },

          types: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },

          medications: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },

          analyses: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },

          vaccinations: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },

          attachments: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: [
          {
            fecha: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      });

      const resultado = consultas.map((consulta) => ({
        id: consulta.id,

        visit_at: consulta.fecha,
        fecha: consulta.fecha,

        reason: consulta.motivo,
        motivo: consulta.motivo,

        diagnosis: consulta.diagnostico,
        diagnostico: consulta.diagnostico,

        notes: consulta.observaciones,
        observaciones: consulta.observaciones,

        estado: consulta.estado,
        gravedad: consulta.gravedad,

        proxima_cita: consulta.proximaCita,
        motivo_seguimiento: consulta.motivoSeguimiento,

        peso:
          consulta.peso === null
            ? null
            : Number(consulta.peso),

        temperatura:
          consulta.temperatura === null
            ? null
            : Number(consulta.temperatura),

        frecuencia_cardiaca: consulta.frecuenciaCardiaca,
        frecuencia_respiratoria: consulta.frecuenciaRespiratoria,
        presion_arterial: consulta.presionArterial,
        saturacion_oxigeno: consulta.saturacionOxigeno,

        doctor: consulta.doctor?.username || null,

        tipos_consulta: consulta.types.map(
          (tipo) => tipo.tipoConsultaId
        ),

        tipos_consulta_detalle: consulta.types.map((tipo) => ({
          id: tipo.id,
          codigo: tipo.tipoConsultaId,
          nombre: null,
        })),

        treatment:
          consulta.medications.length > 0
            ? consulta.medications
                .map((medicacion) => medicacion.medicamento)
                .join(", ")
            : null,

        medicaciones: consulta.medications.map((medicacion) => ({
          medicamento: medicacion.medicamento,
          indicaciones: medicacion.indicaciones,
        })),

        analisis: consulta.analyses.map((analisis) => ({
          analisis: analisis.analisis,
          resultado_observacion:
            analisis.resultadoObservacion,
        })),

        vacunas: consulta.vaccinations.map((vacuna) => ({
          vacuna: vacuna.vacuna,
          lote_observaciones: vacuna.loteObservaciones,
        })),

        adjuntos: consulta.attachments.map((adjunto) => ({
          nombre_archivo: adjunto.nombreArchivo,

          ruta_archivo:
            adjunto.publicUrl || adjunto.rutaArchivo,

          tipo_archivo: adjunto.tipoArchivo,
          tamano_bytes: adjunto.tamanoBytes,

          storage_provider: adjunto.storageProvider,
          storage_key: adjunto.storageKey,
          public_url: adjunto.publicUrl,
        })),
      }));

      return res.json(resultado);
    } catch (error) {
      console.error(
        "Error loading clinical history with Prisma:",
        error
      );

      return res.status(500).json({
        message: "Error interno del servidor.",
        detail: error.message,
        code: error.code || null,
      });
    }
  }
);

// =============================
// REGISTER USER
// =============================
app.post("/api/auth/register", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        message: "Username, password and role are required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanRole = role.trim().toUpperCase();

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

    const [existingUsers] = await pool.execute(
      `
      SELECT id
      FROM users
      WHERE username = ?
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [cleanUsername]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Username already exists.",
      });
    }

    const userId = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(cleanPassword, 10);

    await pool.execute(
      `
      INSERT INTO users (
        id,
        username,
        password_hash,
        role,
        deleted_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, NULL, NOW(), NOW())
      `,
      [userId, cleanUsername, passwordHash, cleanRole]
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: userId,
        username: cleanUsername,
        role: cleanRole,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: error.message,
      code: error.code || null,
      sqlMessage: error.sqlMessage || null,
    });
  }
});
// =============================
// LOGIN USER - PRISMA / NEON
// =============================
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    const cleanUsername = String(username || "").trim();
    const cleanPassword = String(password || "");

    if (!cleanUsername || !cleanPassword) {
      return res.status(400).json({
        message: "Nombre de usuario y contraseÃ±a son requeridos.",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: "insensitive",
        },
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Usuario o contraseÃ±a incorrectos.",
      });
    }

    const validPassword = await bcrypt.compare(
      cleanPassword,
      user.passwordHash
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Usuario o contraseÃ±a incorrectos.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN PRISMA ERROR:", error);

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
});

// =============================
// EMAIL JOB - CONSULTAS ATRASADAS
// =============================
async function enviarCorreosConsultasAtrasadas() {
  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `
      SELECT
        c.id,
        c.fecha,
        c.proxima_cita,
        c.motivo,
        c.estado,
        c.client_id,
        cl.email AS cliente_correo,
        CONCAT(cl.first_name, ' ', cl.last_name) AS cliente_nombre,
        p.name AS mascota_nombre
      FROM consultas c
      INNER JOIN clients cl
        ON cl.id = c.client_id
      INNER JOIN pets p
        ON p.id = c.pet_id
      WHERE c.deleted_at IS NULL
        AND cl.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND c.proxima_cita IS NOT NULL
        AND DATE(c.proxima_cita) < CURDATE()
        AND c.atraso_notificado_at IS NULL
        AND cl.email IS NOT NULL
        AND TRIM(cl.email) <> ''
      ORDER BY c.proxima_cita ASC
      `
    );

    for (const row of rows) {
      try {
        await enviarCorreoConsulta({
          connection,
          row,
          tipo: "atrasada",
          marcarNotificado: true,
        });

        console.log(
          `Correo enviado por consulta atrasada. Consulta: ${row.id}, email: ${row.cliente_correo}`
        );
      } catch (mailError) {
        console.error(
          `Error enviando correo de consulta atrasada ${row.id}:`,
          mailError
        );
      }
    }
  } catch (error) {
    console.error("Error revisando consultas atrasadas:", error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

app.post("/api/consultas/:id/enviar-recordatorio", requireAuth, async (req, res) => {
  const { id } = req.params;

  let connection;

  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `
      SELECT
        c.id,
        c.proxima_cita,
        c.motivo,
        cl.email AS cliente_correo,
        CONCAT(cl.first_name, ' ', cl.last_name) AS cliente_nombre,
        p.name AS mascota_nombre
      FROM consultas c
      INNER JOIN clients cl ON cl.id = c.client_id
      INNER JOIN pets p ON p.id = c.pet_id
      WHERE c.id = ?
        AND c.deleted_at IS NULL
        AND cl.email IS NOT NULL
        AND TRIM(cl.email) <> ''
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Consulta no vÃ¡lida o sin correo.",
      });
    }

    const row = rows[0];

    const html = `
      <div style="font-family: Arial, Helvetica, sans-serif; background-color:#f5f7fa; padding:24px;">
        <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;">

          <div style="padding:28px 32px 10px; text-align:center;">
            <img src="cid:logoVerde" width="72" alt="VetCare" style="display:block; margin:0 auto 12px;" />
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
              Si necesita realizar algÃºn cambio en la cita, le recomendamos comunicarse con nosotros con anticipaciÃ³n.
            </p>

            <p style="margin:0 0 16px;">
              Gracias por confiar en VetCare. SerÃ¡ un placer atenderle.
            </p>

            <div style="margin-top:28px; padding-top:18px; border-top:1px solid #e5e7eb; font-size:13px; color:#6b7280;">
              <p style="margin:0 0 6px;"><strong>VetCare</strong></p>
              <p style="margin:0;">Este es un mensaje automÃ¡tico enviado desde nuestro sistema.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    await mailTransporter.sendMail({
      from: process.env.MAIL_FROM,
      to: row.cliente_correo,
      subject: `Recordatorio de consulta - ${row.mascota_nombre}`,
      html,
      attachments: [
        {
          filename: "logo-verde.png",
          path: path.join(__dirname, "../public/logo-verde.png"),
          cid: "logoVerde",
        },
      ],
    });

    return res.json({
      message: "Correo enviado manualmente.",
    });
  } catch (error) {
    console.error("Error manual:", error);

    return res.status(500).json({
      message: "Error enviando correo.",
    });
  } finally {
    if (connection) connection.release();
  }
});

const emailJobsEnabled = process.env.ENABLE_EMAIL_JOBS === "true";

if (emailJobsEnabled) {
  cron.schedule("*/10 * * * *", async () => {
    console.log(
      "Revisando consultas atrasadas y citas de maÃ±ana para enviar correos..."
    );

    await enviarCorreosConsultasAtrasadas();
    await enviarCorreosConsultasManana();
  });
} else {
  console.log(
    "Tareas automÃ¡ticas de correo desactivadas temporalmente."
  );
}

// =============================
// CLIENT PORTAL
// =============================
function requireClient(req, res, next) {
  const role = String(req.user?.role || "").toUpperCase();
  const clientId = req.user?.client_id ?? req.user?.clientId;

  if (role !== "CLIENT" || !clientId) {
    return res.status(403).json({
      message: "Acceso exclusivo para clientes del portal.",
    });
  }

  req.clientId = String(clientId);
  next();
}

// Mascotas pertenecientes al cliente autenticado
app.get(
  "/api/portal/mascotas",
  requireAuth,
  requireClient,
  async (req, res) => {
    try {
      const pets = await prisma.pet.findMany({
        where: {
          clientId: req.clientId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          sex: true,
          ageYears: true,
          weightKg: true,
          weightText: true,
          observations: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      const response = pets.map((pet) => ({
        id: pet.id,
        nombre: pet.name,
        especie: pet.species,
        raza: pet.breed,
        sexo: pet.sex,
        edad: pet.ageYears,
        peso:
          pet.weightKg === null || pet.weightKg === undefined
            ? null
            : Number(pet.weightKg),
        weight_text: pet.weightText,
        observaciones: pet.observations,
      }));

      return res.json(response);
    } catch (error) {
      console.error("Error cargando mascotas del portal con Prisma:", error);

      return res.status(500).json({
        message: "Error interno del servidor.",
        detail: error.message,
      });
    }
  }
);

// Detalle de una mascota perteneciente al cliente autenticado
app.get(
  "/api/portal/mascotas/:id",
  requireAuth,
  requireClient,
  async (req, res) => {
    try {
      const pet = await prisma.pet.findFirst({
        where: {
          id: String(req.params.id),
          clientId: req.clientId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          sex: true,
          ageYears: true,
          weightKg: true,
          weightText: true,
          observations: true,

          consultations: {
            where: {
              clientId: req.clientId,
              deletedAt: null,
            },
            select: {
              fecha: true,

              vaccinations: {
                where: {
                  deletedAt: null,
                },
                select: {
                  vacuna: true,
                  fechaAplicacion: true,
                  fechaRefuerzo: true,
                  lote: true,
                  laboratorio: true,
                  veterinario: true,
                  loteObservaciones: true,
                },
              },
            },
          },
        },
      });

      if (!pet) {
        return res.status(404).json({
          message: "Mascota no encontrada.",
        });
      }

      const carnet = pet.consultations
        .flatMap((consultation) =>
          consultation.vaccinations.map((vaccination) => ({
            vacuna: vaccination.vacuna,
            fecha_aplicacion: vaccination.fechaAplicacion,
            fecha_refuerzo: vaccination.fechaRefuerzo,
            lote: vaccination.lote,
            laboratorio: vaccination.laboratorio,
            veterinario: vaccination.veterinario,
            lote_observaciones: vaccination.loteObservaciones,
            fecha_consulta: consultation.fecha,
          }))
        )
        .sort((a, b) => {
          const dateA = new Date(
            a.fecha_aplicacion ?? a.fecha_consulta
          ).getTime();

          const dateB = new Date(
            b.fecha_aplicacion ?? b.fecha_consulta
          ).getTime();

          return dateB - dateA;
        });

      return res.json({
        id: pet.id,
        nombre: pet.name,
        especie: pet.species,
        raza: pet.breed,
        sexo: pet.sex,
        edad: pet.ageYears,
        fecha_nacimiento: null,
        peso:
          pet.weightKg === null || pet.weightKg === undefined
            ? null
            : Number(pet.weightKg),
        weight_text: pet.weightText,
        observaciones: pet.observations,
        estado_salud: null,
        carnet,
      });
    } catch (error) {
      console.error(
        "Error cargando mascota del portal con Prisma:",
        error
      );

      return res.status(500).json({
        message: "Error interno del servidor.",
        detail: error.message,
      });
    }
  }
);


// Historial clínico de una mascota perteneciente al cliente autenticado
app.get(
  "/api/portal/mascotas/:id/consultas",
  requireAuth,
  requireClient,
  async (req, res) => {
    try {
      const petId = String(req.params.id);

      const pet = await prisma.pet.findFirst({
        where: {
          id: petId,
          clientId: req.clientId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!pet) {
        return res.status(404).json({
          message: "Mascota no encontrada.",
        });
      }

      const consultas = await prisma.consultation.findMany({
        where: {
          petId,
          clientId: req.clientId,
          deletedAt: null,
        },
        include: {
          doctor: {
            select: {
              username: true,
            },
          },
          types: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          medications: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          analyses: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          vaccinations: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          attachments: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: [
          {
            fecha: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      });

      const resultado = consultas.map((consulta) => ({
        id: consulta.id,
        visit_at: consulta.fecha,
        fecha: consulta.fecha,
        reason: consulta.motivo,
        motivo: consulta.motivo,
        diagnosis: consulta.diagnostico,
        diagnostico: consulta.diagnostico,
        notes: consulta.observaciones,
        observaciones: consulta.observaciones,
        estado: consulta.estado,
        gravedad: consulta.gravedad,
        proxima_cita: consulta.proximaCita,
        motivo_seguimiento: consulta.motivoSeguimiento,
        peso: consulta.peso === null ? null : Number(consulta.peso),
        temperatura:
          consulta.temperatura === null
            ? null
            : Number(consulta.temperatura),
        frecuencia_cardiaca: consulta.frecuenciaCardiaca,
        frecuencia_respiratoria: consulta.frecuenciaRespiratoria,
        presion_arterial: consulta.presionArterial,
        saturacion_oxigeno: consulta.saturacionOxigeno,
        doctor: consulta.doctor?.username || null,

        tipos_consulta: consulta.types.map(
          (tipo) => tipo.tipoConsultaId
        ),

        tipos_consulta_detalle: consulta.types.map((tipo) => ({
          id: tipo.id,
          codigo: tipo.tipoConsultaId,
          nombre: null,
        })),

        treatment:
          consulta.medications.length > 0
            ? consulta.medications
                .map((medicacion) => medicacion.medicamento)
                .join(", ")
            : null,

        medicaciones: consulta.medications.map((medicacion) => ({
          medicamento: medicacion.medicamento,
          indicaciones: medicacion.indicaciones,
        })),

        analisis: consulta.analyses.map((analisis) => ({
          analisis: analisis.analisis,
          resultado_observacion: analisis.resultadoObservacion,
        })),

        vacunas: consulta.vaccinations.map((vacuna) => ({
          vacuna: vacuna.vacuna,
          fecha_aplicacion: vacuna.fechaAplicacion,
          fecha_refuerzo: vacuna.fechaRefuerzo,
          lote: vacuna.lote,
          laboratorio: vacuna.laboratorio,
          veterinario: vacuna.veterinario,
          lote_observaciones: vacuna.loteObservaciones,
        })),

        adjuntos: consulta.attachments.map((adjunto) => ({
          nombre_archivo: adjunto.nombreArchivo,
          ruta_archivo:
            adjunto.publicUrl || adjunto.rutaArchivo,
          tipo_archivo: adjunto.tipoArchivo,
          tamano_bytes: adjunto.tamanoBytes,
          storage_provider: adjunto.storageProvider,
          storage_key: adjunto.storageKey,
          public_url: adjunto.publicUrl,
        })),
      }));

      return res.json(resultado);
    } catch (error) {
      console.error(
        "Error cargando historial del portal con Prisma:",
        error
      );

      return res.status(500).json({
        message: "Error interno del servidor.",
        detail: error.message,
      });
    }
  }
);

// Perfil del cliente autenticado
app.get(
  "/api/portal/perfil",
  requireAuth,
  requireClient,
  async (req, res) => {
    try {
      const client = await prisma.client.findFirst({
        where: {
          id: req.clientId,
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phonePrimary: true,
          phoneSecondary: true,
          addressLine1: true,
        },
      });

      if (!client) {
        return res.status(404).json({
          message: "Perfil no encontrado.",
        });
      }

      return res.json({
        id: client.id,
        first_name: client.firstName,
        last_name: client.lastName,
        email: client.email,
        phone_primary: client.phonePrimary,
        phone_secondary: client.phoneSecondary,
        address_line1: client.addressLine1,
        address_line2: null,
        city: null,
        province_state: null,
      });
    } catch (error) {
      console.error(
        "Error cargando perfil del portal con Prisma:",
        error
      );

      return res.status(500).json({
        message: "Error interno del servidor.",
        detail: error.message,
      });
    }
  }
);

// Permite que React maneje las rutas del frontend
app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// =============================
// SERVER
// =============================
const PORT = process.env.PORT || 5000;

if (emailJobsEnabled) {
  enviarCorreosConsultasAtrasadas();
  enviarCorreosConsultasManana();
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
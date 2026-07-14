import bcrypt from "bcrypt";
import prisma from "./db.js";

async function createUser() {
  try {
    const username = "admin";
    const password = "Admin123*";
    const role = "ADMIN";

    const existingUser = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (existingUser) {
      console.log(`El usuario "${username}" ya existe en Neon.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    console.log("Usuario creado correctamente en Neon.");
    console.log(user);
    console.log("Contraseña temporal:", password);
  } catch (error) {
    console.error("Error creando usuario en Neon:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
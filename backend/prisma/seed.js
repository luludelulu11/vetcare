import bcrypt from "bcrypt";
import prisma from "./client.js";

async function upsertStaff(username, password, role, email, firstName, lastName) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { username },
    update: { email, firstName, lastName },
    create: { username, email, firstName, lastName, passwordHash, role },
  });
}

async function main() {
  await upsertStaff("admin", "Admin123*", "ADMIN", "admin@vetcare.test", "Carmen", "Reyes");
  console.log("ADMIN listo -> usuario: admin / contraseña: Admin123*");

  const doctorUser = await upsertStaff(
    "doctor",
    "Doctor123*",
    "DOCTOR",
    "doctor@vetcare.test",
    "Ana",
    "Fernández"
  );
  await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      fullName: "Dra. Ana Fernández",
      specialty: "Medicina Interna Veterinaria",
      licenseNumber: "VET-004",
    },
  });
  console.log("DOCTOR listo -> usuario: doctor / contraseña: Doctor123*");

  await upsertStaff(
    "secretaria",
    "Staff123*",
    "STAFF",
    "secretaria@vetcare.test",
    "Sofía",
    "Martínez"
  );
  console.log("STAFF listo -> usuario: secretaria / contraseña: Staff123*");

  const clientPasswordHash = await bcrypt.hash("Cliente123*", 10);
  const client = await prisma.client.upsert({
    where: { username: "cliente" },
    update: {},
    create: {
      firstName: "Laura",
      lastName: "Gómez",
      email: "laura.gomez@example.com",
      phonePrimary: "809-555-0101",
      addressLine1: "Calle Principal 123",
      username: "cliente",
      passwordHash: clientPasswordHash,
    },
  });
  console.log("CLIENT listo -> usuario: cliente / contraseña: Cliente123*");

  const existingPet = await prisma.pet.findFirst({
    where: { clientId: client.id, deletedAt: null },
  });

  if (!existingPet) {
    await prisma.pet.create({
      data: {
        clientId: client.id,
        name: "Toby",
        breed: "Labrador",
        sex: "MALE",
        ageYears: 3,
        weightKg: 22.5,
        weightText: "22.5",
        species: "CANINE",
      },
    });
    console.log("Mascota de ejemplo creada -> Toby");
  }
}

main()
  .catch((error) => {
    console.error("Error en el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- CreateEnum
CREATE TYPE "PetSpecies" AS ENUM ('CANINE', 'FELINE');

-- CreateEnum
CREATE TYPE "AppointmentPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "consulta_adjuntos" ADD COLUMN     "public_url" TEXT,
ADD COLUMN     "storage_key" TEXT,
ADD COLUMN     "storage_provider" TEXT;

-- AlterTable
ALTER TABLE "consultas" ADD COLUMN     "ai_diagnosis_sources" TEXT,
ADD COLUMN     "ai_diagnosis_suggestion" TEXT;

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "has_microchip" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "microchip_number" TEXT,
ADD COLUMN     "species" "PetSpecies";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_changed_at" TIMESTAMP(3),
ADD COLUMN     "profile_photo_url" TEXT;

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "appointment_type_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "priority" "AppointmentPriority" NOT NULL DEFAULT 'NORMAL',
    "is_pet_aggressive" BOOLEAN NOT NULL DEFAULT false,
    "estimated_price" DECIMAL(10,2),
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grooming_records" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "unusual_findings" TEXT,
    "service_details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grooming_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "consultation_id" TEXT NOT NULL,
    "medication" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccine_cards" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "has_microchip" BOOLEAN NOT NULL DEFAULT false,
    "microchip_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccine_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "pet_id" TEXT,
    "client_id" TEXT,
    "channel" "AlertChannel" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "ip_address" TEXT,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "remaining_attempts" INTEGER NOT NULL DEFAULT 5,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_digital_ids" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "qr_url" TEXT,

    CONSTRAINT "pet_digital_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_travel_documents" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "destination" TEXT,
    "requirements" TEXT,
    "encrypted_data" TEXT,
    "issued_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pet_travel_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointment_types_name_key" ON "appointment_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "grooming_records_appointment_id_key" ON "grooming_records"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "vaccine_cards_pet_id_key" ON "vaccine_cards"("pet_id");

-- CreateIndex
CREATE UNIQUE INDEX "pet_digital_ids_pet_id_key" ON "pet_digital_ids"("pet_id");

-- CreateIndex
CREATE UNIQUE INDEX "pet_digital_ids_code_key" ON "pet_digital_ids"("code");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_appointment_type_id_fkey" FOREIGN KEY ("appointment_type_id") REFERENCES "appointment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grooming_records" ADD CONSTRAINT "grooming_records_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_cards" ADD CONSTRAINT "vaccine_cards_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_digital_ids" ADD CONSTRAINT "pet_digital_ids_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_travel_documents" ADD CONSTRAINT "pet_travel_documents_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "appointment_types" ADD COLUMN     "price" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "profile_photo_url" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT;

-- CreateTable
CREATE TABLE "clinic_settings" (
    "id" TEXT NOT NULL,
    "aggressive_pet_surcharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id")
);

-- Seed data: placeholder price (0 = "not yet set") on existing appointment
-- types so price math never has to special-case NULL; admin edits these via
-- the new /admin/servicios screen.
UPDATE "appointment_types" SET "price" = 0 WHERE "price" IS NULL;

-- Seed the single clinic settings row.
INSERT INTO "clinic_settings" ("id", "aggressive_pet_surcharge", "updated_at")
VALUES (gen_random_uuid(), 0, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

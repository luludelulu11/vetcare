-- AlterTable
ALTER TABLE "consulta_vacunas" ADD COLUMN     "fecha_aplicacion" DATE,
ADD COLUMN     "fecha_refuerzo" DATE,
ADD COLUMN     "laboratorio" TEXT,
ADD COLUMN     "lote" TEXT,
ADD COLUMN     "veterinario" TEXT;

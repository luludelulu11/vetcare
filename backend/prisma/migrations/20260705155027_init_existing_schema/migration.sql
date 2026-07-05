-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "national_id" TEXT,
    "email" TEXT,
    "phone_primary" TEXT,
    "phone_secondary" TEXT,
    "address_line1" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT,
    "sex" TEXT,
    "age_years" INTEGER,
    "weight_kg" DECIMAL(10,2),
    "weight_text" TEXT,
    "observations" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "diagnostico" TEXT,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'abierta',
    "gravedad" TEXT NOT NULL DEFAULT 'moderada',
    "proxima_cita" TIMESTAMP(3),
    "motivo_seguimiento" TEXT,
    "peso" DECIMAL(10,2),
    "temperatura" DECIMAL(5,2),
    "frecuencia_cardiaca" INTEGER,
    "frecuencia_respiratoria" INTEGER,
    "presion_arterial" TEXT,
    "saturacion_oxigeno" INTEGER,
    "atraso_notificado_at" TIMESTAMP(3),
    "recordatorio_manana_enviado_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta_tipos" (
    "id" TEXT NOT NULL,
    "consulta_id" TEXT NOT NULL,
    "tipo_consulta_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulta_tipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta_embarazo" (
    "id" TEXT NOT NULL,
    "consulta_id" TEXT NOT NULL,
    "meses_gestacion" INTEGER,
    "cantidad_crias" INTEGER,
    "riesgo" TEXT,
    "tipo_parto" TEXT,
    "fecha_probable_parto" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulta_embarazo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta_medicaciones" (
    "id" TEXT NOT NULL,
    "consulta_id" TEXT NOT NULL,
    "medicamento" TEXT NOT NULL,
    "indicaciones" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulta_medicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta_analisis" (
    "id" TEXT NOT NULL,
    "consulta_id" TEXT NOT NULL,
    "analisis" TEXT NOT NULL,
    "resultado_observacion" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulta_analisis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta_vacunas" (
    "id" TEXT NOT NULL,
    "consulta_id" TEXT NOT NULL,
    "vacuna" TEXT NOT NULL,
    "lote_observaciones" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulta_vacunas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consulta_adjuntos" (
    "id" TEXT NOT NULL,
    "consulta_id" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "tipo_archivo" TEXT,
    "tamano_bytes" INTEGER,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consulta_adjuntos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "clients_national_id_key" ON "clients"("national_id");

-- CreateIndex
CREATE UNIQUE INDEX "consulta_embarazo_consulta_id_key" ON "consulta_embarazo"("consulta_id");

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas" ADD CONSTRAINT "consultas_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_tipos" ADD CONSTRAINT "consulta_tipos_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_embarazo" ADD CONSTRAINT "consulta_embarazo_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_medicaciones" ADD CONSTRAINT "consulta_medicaciones_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_analisis" ADD CONSTRAINT "consulta_analisis_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_vacunas" ADD CONSTRAINT "consulta_vacunas_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consulta_adjuntos" ADD CONSTRAINT "consulta_adjuntos_consulta_id_fkey" FOREIGN KEY ("consulta_id") REFERENCES "consultas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

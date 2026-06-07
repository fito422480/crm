-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VENDEDOR');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NUEVO', 'EXPLORANDO_LOTEAMIENTOS', 'CONSULTO_CUOTAS', 'COMPARANDO_OPCIONES', 'QUIERE_VISITA', 'QUIERE_ASESOR', 'RESERVA_POTENCIAL', 'CERRADO');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('URGENTE', 'ALTA', 'MEDIA', 'NORMAL', 'BAJA');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('LIBRE', 'VENDIDO', 'RESERVADO');

-- CreateEnum
CREATE TYPE "InteractionRole" AS ENUM ('USER', 'BOT', 'AGENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VENDEDOR',
    "zone" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "intent" TEXT,
    "ciudad" TEXT,
    "nombre_fraccion" TEXT,
    "manzana" TEXT,
    "numero_lote" TEXT,
    "quiere_asesor" BOOLEAN NOT NULL DEFAULT false,
    "quiere_visita" BOOLEAN NOT NULL DEFAULT false,
    "quiere_reserva" BOOLEAN NOT NULL DEFAULT false,
    "presupuesto_cuota" TEXT,
    "proposito" TEXT,
    "forma_pago" TEXT,
    "lead_stage" "LeadStage" NOT NULL DEFAULT 'NUEVO',
    "lead_priority" "LeadPriority" NOT NULL DEFAULT 'NORMAL',
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "ultimo_estado" TEXT,
    "ultima_actividad" TIMESTAMP(3),
    "context" JSONB,
    "memory" JSONB,
    "source" TEXT DEFAULT 'whatsapp',
    "notes" TEXT,
    "zona_asignada" TEXT,
    "vendedor_asignado_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "role" "InteractionRole" NOT NULL,
    "content" TEXT NOT NULL,
    "content_type" TEXT DEFAULT 'text',
    "intent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "external_id" TEXT,
    "name" TEXT NOT NULL,
    "departamento" TEXT,
    "ciudad" TEXT,
    "lotes_disponibles" INTEGER DEFAULT 0,
    "precio_min" DECIMAL(65,30),
    "precio_max" DECIMAL(65,30),
    "cuota_estimada" DECIMAL(65,30),
    "description" TEXT,
    "metadata" JSONB,
    "last_sync" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lots" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "external_id" TEXT,
    "manzana" TEXT,
    "numero" TEXT,
    "status" "LotStatus" NOT NULL DEFAULT 'LIBRE',
    "precio" DECIMAL(65,30),
    "area" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_lots" (
    "lead_id" TEXT NOT NULL,
    "lot_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_lots_pkey" PRIMARY KEY ("lead_id","lot_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "leads_phone_key" ON "leads"("phone");

-- CreateIndex
CREATE INDEX "interactions_lead_id_idx" ON "interactions"("lead_id");

-- CreateIndex
CREATE INDEX "properties_ciudad_idx" ON "properties"("ciudad");

-- CreateIndex
CREATE INDEX "lots_property_id_idx" ON "lots"("property_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_vendedor_asignado_id_fkey" FOREIGN KEY ("vendedor_asignado_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_lots" ADD CONSTRAINT "lead_lots_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_lots" ADD CONSTRAINT "lead_lots_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

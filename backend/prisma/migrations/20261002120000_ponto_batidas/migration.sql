-- Ponto sai do arquivo sis-ponto.json para o Postgres: cada batida é um
-- evento (ENTRADA/SAIDA) com clientId único gerado no aparelho, o que torna o
-- reenvio offline idempotente. A importação do JSON é feita à parte, pelo
-- script backend/scripts/migrarSisPontoJson.js.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PontoTipo" AS ENUM ('ENTRADA', 'SAIDA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "padraoHorarioId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PontoBatida" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "PontoTipo" NOT NULL,
    "batidoEm" TIMESTAMP(3) NOT NULL,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT,
    "registradoPorId" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'APP',
    "inconsistente" BOOLEAN NOT NULL DEFAULT false,
    "motivoInconsistencia" TEXT,
    "removidoEm" TIMESTAMP(3),
    "removidoPorId" TEXT,

    CONSTRAINT "PontoBatida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PontoDispositivo" (
    "deviceId" TEXT NOT NULL,
    "ultimoContato" TIMESTAMP(3) NOT NULL,
    "pendentes" INTEGER NOT NULL DEFAULT 0,
    "userAgent" TEXT,

    CONSTRAINT "PontoDispositivo_pkey" PRIMARY KEY ("deviceId")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PontoBatida_clientId_key" ON "PontoBatida"("clientId");
CREATE INDEX IF NOT EXISTS "PontoBatida_userId_batidoEm_idx" ON "PontoBatida"("userId", "batidoEm");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PontoBatida" ADD CONSTRAINT "PontoBatida_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

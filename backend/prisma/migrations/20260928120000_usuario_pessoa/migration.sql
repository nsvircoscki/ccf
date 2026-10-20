-- AlterTable
-- User passa a representar uma pessoa (vários por setor), com login próprio.
-- Os campos de ponto (registraPonto, horista) são usados pelo SisPonto.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "registraPonto" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "horista" BOOLEAN NOT NULL DEFAULT false;

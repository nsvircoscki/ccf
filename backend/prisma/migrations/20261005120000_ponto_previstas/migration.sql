-- Esquecimento de batida: o servidor registra o horário previsto da jornada
-- (origem PREVISTA) e o ENG decide se abona ou se é falta.

-- AlterTable
-- Quem já existe passa a ser cobrado a partir de agora (nada retroativo).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pontoDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "PontoBatida" ADD COLUMN IF NOT EXISTS "situacao" TEXT;
ALTER TABLE "PontoBatida" ADD COLUMN IF NOT EXISTS "decididoPorId" TEXT;
ALTER TABLE "PontoBatida" ADD COLUMN IF NOT EXISTS "decididoEm" TIMESTAMP(3);

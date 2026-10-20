-- Correção de ponto pelo ENG passa a exigir motivo: na inclusão de batida
-- (origem AJUSTE) e na exclusão.

-- AlterTable
ALTER TABLE "PontoBatida" ADD COLUMN IF NOT EXISTS "motivoAjuste" TEXT;
ALTER TABLE "PontoBatida" ADD COLUMN IF NOT EXISTS "motivoRemocao" TEXT;

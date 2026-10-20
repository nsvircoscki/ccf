-- AlterTable
-- Destino ao clicar na notificação: "kanban" (padrão, comportamento antigo),
-- "sis-ponto" ou "sis-ponto-justificativa". Veio no merge da branch
-- feat/arquivo-estagiario, que alterou o schema sem gerar a migration.
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "tipo" TEXT NOT NULL DEFAULT 'kanban';

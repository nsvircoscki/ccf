-- Reconcilia o histórico de migrations com o schema atual.
-- Escrita de forma idempotente porque a base existente já recebeu parte
-- destas alterações fora do controle de migrations (Comment, matricula,
-- endereco e details).

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "details" TEXT;
ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "endereco" TEXT;
ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "matricula" TEXT;
ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "servicoId" TEXT;
ALTER TABLE "Workflow" ADD COLUMN IF NOT EXISTS "terreno" TEXT DEFAULT 'Urbano';

-- CreateTable
CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Servico" (
    "id" TEXT NOT NULL,
    "numeroServico" TEXT NOT NULL,
    "tipoCliente" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "contato" TEXT,
    "area" DOUBLE PRECISION,
    "municipio" TEXT NOT NULL,
    "linhaSecaKm" DOUBLE PRECISION,
    "rioKm" DOUBLE PRECISION,
    "caminhoPasta" TEXT,
    "arquivoKml" TEXT,
    "tiposSolicitados" TEXT[],
    "statusOrcamento" TEXT NOT NULL DEFAULT 'PENDENTE',
    "valorTotal" DOUBLE PRECISION,
    "contratoGerado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Servico_numeroServico_key" ON "Servico"("numeroServico");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

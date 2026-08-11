-- AlterTable
ALTER TABLE "Servico" ADD COLUMN     "procuradorId" TEXT;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_procuradorId_fkey" FOREIGN KEY ("procuradorId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

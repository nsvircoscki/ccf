-- AlterTable
ALTER TABLE "Imovel" ADD COLUMN     "comarca" TEXT,
ADD COLUMN     "zoneamento" TEXT;

-- AlterTable
ALTER TABLE "Servico" ADD COLUMN     "areasDesmembramento" TEXT,
ADD COLUMN     "averbacoes" TEXT,
ADD COLUMN     "listaProtocoloEntrega" TEXT,
ADD COLUMN     "totalLotes" INTEGER;

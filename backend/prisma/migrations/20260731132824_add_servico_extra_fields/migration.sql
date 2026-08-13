-- AlterTable
ALTER TABLE "Servico" ADD COLUMN     "codRespTecn" TEXT,
ADD COLUMN     "confrontaCertificacao" TEXT,
ADD COLUMN     "matricula" TEXT,
ADD COLUMN     "notas" TEXT,
ADD COLUMN     "possuiCar" TEXT,
ADD COLUMN     "possuiCertificacao" TEXT,
ADD COLUMN     "respTecn" TEXT,
ADD COLUMN     "terreno" TEXT DEFAULT 'Urbano';

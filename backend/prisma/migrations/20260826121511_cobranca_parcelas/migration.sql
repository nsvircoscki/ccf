/*
  Warnings:

  - You are about to drop the column `caminhoPdf` on the `Cobranca` table. All the data in the column will be lost.
  - You are about to drop the column `codigoSolicitacao` on the `Cobranca` table. All the data in the column will be lost.
  - You are about to drop the column `erroMensagem` on the `Cobranca` table. All the data in the column will be lost.
  - You are about to drop the column `seuNumero` on the `Cobranca` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Cobranca` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Cobranca` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `Cobranca` table. All the data in the column will be lost.
  - You are about to drop the column `vencimento` on the `Cobranca` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `Cobranca` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Cobranca" DROP COLUMN "caminhoPdf",
DROP COLUMN "codigoSolicitacao",
DROP COLUMN "erroMensagem",
DROP COLUMN "seuNumero",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
DROP COLUMN "valor",
DROP COLUMN "vencimento",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "ParcelaCobranca" (
    "id" TEXT NOT NULL,
    "cobrancaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "seuNumero" TEXT,
    "codigoSolicitacao" TEXT,
    "caminhoPdf" TEXT,
    "erroMensagem" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParcelaCobranca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParcelaCobranca_cobrancaId_numero_key" ON "ParcelaCobranca"("cobrancaId", "numero");

-- AddForeignKey
ALTER TABLE "ParcelaCobranca" ADD CONSTRAINT "ParcelaCobranca_cobrancaId_fkey" FOREIGN KEY ("cobrancaId") REFERENCES "Cobranca"("id") ON DELETE CASCADE ON UPDATE CASCADE;

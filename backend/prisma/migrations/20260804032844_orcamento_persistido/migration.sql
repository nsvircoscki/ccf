-- AlterTable
ALTER TABLE "Servico" ADD COLUMN     "baseJuros" TEXT,
ADD COLUMN     "descontoPercentual" DOUBLE PRECISION,
ADD COLUMN     "descontoValor" DOUBLE PRECISION,
ADD COLUMN     "entradaData" TIMESTAMP(3),
ADD COLUMN     "entradaValor" DOUBLE PRECISION,
ADD COLUMN     "jurosAtivo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "numeroParcelas" INTEGER,
ADD COLUMN     "taxaJuros" DOUBLE PRECISION,
ADD COLUMN     "tipoJuros" TEXT,
ADD COLUMN     "valorFinal" DOUBLE PRECISION,
ADD COLUMN     "valorReferencia" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "OrcamentoItem" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "indice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "selecionado" BOOLEAN NOT NULL DEFAULT false,
    "servicoId" TEXT NOT NULL,

    CONSTRAINT "OrcamentoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelaOrcamento" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valorBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "juros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorFinal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vencimento" TIMESTAMP(3),
    "servicoId" TEXT NOT NULL,

    CONSTRAINT "ParcelaOrcamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrcamentoItem_servicoId_nome_key" ON "OrcamentoItem"("servicoId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "ParcelaOrcamento_servicoId_numero_key" ON "ParcelaOrcamento"("servicoId", "numero");

-- AddForeignKey
ALTER TABLE "OrcamentoItem" ADD CONSTRAINT "OrcamentoItem_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelaOrcamento" ADD CONSTRAINT "ParcelaOrcamento_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

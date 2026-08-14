-- CreateTable
CREATE TABLE "TipoProcessoEtapa" (
    "id" TEXT NOT NULL,
    "tipoProcesso" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "setor" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "TipoProcessoEtapa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoProcessoEtapa_tipoProcesso_nome_key" ON "TipoProcessoEtapa"("tipoProcesso", "nome");

-- CreateTable
CREATE TABLE "SequencialTipoServico" (
    "tipo" TEXT NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SequencialTipoServico_pkey" PRIMARY KEY ("tipo")
);

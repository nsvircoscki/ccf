-- CreateTable
CREATE TABLE "Imovel" (
    "id" TEXT NOT NULL,
    "cartorio" TEXT,
    "matricula" TEXT,
    "cns" TEXT,
    "incra" TEXT,
    "cib" TEXT,
    "logradouro" TEXT,
    "municipio" TEXT,
    "area" DOUBLE PRECISION,
    "proprietarioId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Imovel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Imovel" ADD CONSTRAINT "Imovel_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

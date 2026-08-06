-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "estadoCivil" TEXT,
ADD COLUMN     "nacionalidade" TEXT,
ADD COLUMN     "profissao" TEXT;

-- AlterTable
ALTER TABLE "Imovel" ADD COLUMN     "tipoTitulo" TEXT DEFAULT 'matrícula';

-- AlterTable
ALTER TABLE "Servico" ADD COLUMN     "descricaoAtualImovel" TEXT,
ADD COLUMN     "imovelId" TEXT,
ADD COLUMN     "memorialDescritivoRetificacao" TEXT,
ADD COLUMN     "proprietarioId" TEXT,
ADD COLUMN     "superiorOuInferior" TEXT;

-- CreateTable
CREATE TABLE "Confrontante" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "rg" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "logradouro" TEXT,
    "municipio" TEXT,
    "cep" TEXT,
    "nacionalidade" TEXT,
    "estadoCivil" TEXT,
    "profissao" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Confrontante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConfrontanteToImovel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ConfrontanteToImovel_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ConfrontanteToImovel_B_index" ON "_ConfrontanteToImovel"("B");

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_proprietarioId_fkey" FOREIGN KEY ("proprietarioId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConfrontanteToImovel" ADD CONSTRAINT "_ConfrontanteToImovel_A_fkey" FOREIGN KEY ("A") REFERENCES "Confrontante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConfrontanteToImovel" ADD CONSTRAINT "_ConfrontanteToImovel_B_fkey" FOREIGN KEY ("B") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

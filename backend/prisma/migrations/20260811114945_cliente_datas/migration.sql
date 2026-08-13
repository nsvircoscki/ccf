-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "representanteLegalDataNascimento" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "_ConfrontantesServico" ADD CONSTRAINT "_ConfrontantesServico_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ConfrontantesServico_AB_unique";

-- AlterTable
ALTER TABLE "_ProprietarioImovel" ADD CONSTRAINT "_ProprietarioImovel_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ProprietarioImovel_AB_unique";

-- AlterTable
ALTER TABLE "_ProprietarioServico" ADD CONSTRAINT "_ProprietarioServico_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ProprietarioServico_AB_unique";

-- AlterTable
ALTER TABLE "_UsufrutuarioImovel" ADD CONSTRAINT "_UsufrutuarioImovel_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_UsufrutuarioImovel_AB_unique";

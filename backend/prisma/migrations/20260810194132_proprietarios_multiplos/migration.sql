-- Imovel.proprietarioId (FK única) e Servico.proprietarioId (FK única) viram
-- relações N:M com Cliente, pra suportar mais de um proprietário por imóvel
-- e por serviço. Os dados existentes são migrados para as novas tabelas de
-- junção antes das colunas antigas serem removidas.

-- Imóvel <-> Cliente (proprietários do imóvel)
CREATE TABLE "_ProprietarioImovel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

INSERT INTO "_ProprietarioImovel" ("A", "B")
SELECT "proprietarioId", "id" FROM "Imovel" WHERE "proprietarioId" IS NOT NULL;

ALTER TABLE "Imovel" DROP CONSTRAINT "Imovel_proprietarioId_fkey";
ALTER TABLE "Imovel" DROP COLUMN "proprietarioId";

ALTER TABLE "_ProprietarioImovel" ADD CONSTRAINT "_ProprietarioImovel_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProprietarioImovel" ADD CONSTRAINT "_ProprietarioImovel_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "_ProprietarioImovel_AB_unique" ON "_ProprietarioImovel"("A", "B");
CREATE INDEX "_ProprietarioImovel_B_index" ON "_ProprietarioImovel"("B");

-- Serviço <-> Cliente (proprietários do serviço)
CREATE TABLE "_ProprietarioServico" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

INSERT INTO "_ProprietarioServico" ("A", "B")
SELECT "proprietarioId", "id" FROM "Servico" WHERE "proprietarioId" IS NOT NULL;

ALTER TABLE "Servico" DROP CONSTRAINT "Servico_proprietarioId_fkey";
ALTER TABLE "Servico" DROP COLUMN "proprietarioId";

ALTER TABLE "_ProprietarioServico" ADD CONSTRAINT "_ProprietarioServico_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProprietarioServico" ADD CONSTRAINT "_ProprietarioServico_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "_ProprietarioServico_AB_unique" ON "_ProprietarioServico"("A", "B");
CREATE INDEX "_ProprietarioServico_B_index" ON "_ProprietarioServico"("B");

-- Imovel.usufrutuarioId (FK única) vira relação N:M com Cliente, pra
-- suportar mais de um usufrutuário por imóvel (ex.: ambos os cônjuges).

CREATE TABLE "_UsufrutuarioImovel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

INSERT INTO "_UsufrutuarioImovel" ("A", "B")
SELECT "usufrutuarioId", "id" FROM "Imovel" WHERE "usufrutuarioId" IS NOT NULL;

ALTER TABLE "Imovel" DROP CONSTRAINT "Imovel_usufrutuarioId_fkey";
ALTER TABLE "Imovel" DROP COLUMN "usufrutuarioId";

ALTER TABLE "_UsufrutuarioImovel" ADD CONSTRAINT "_UsufrutuarioImovel_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_UsufrutuarioImovel" ADD CONSTRAINT "_UsufrutuarioImovel_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "_UsufrutuarioImovel_AB_unique" ON "_UsufrutuarioImovel"("A", "B");
CREATE INDEX "_UsufrutuarioImovel_B_index" ON "_UsufrutuarioImovel"("B");

-- Cliente: cônjuge (self-relation 1:1)
ALTER TABLE "Cliente" ADD COLUMN "conjugeId" TEXT;
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_conjugeId_key" UNIQUE ("conjugeId");
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_conjugeId_fkey"
  FOREIGN KEY ("conjugeId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Imovel: usufruto + usufrutuário (Cliente)
ALTER TABLE "Imovel" ADD COLUMN "usufruto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Imovel" ADD COLUMN "usufrutuarioId" TEXT;
ALTER TABLE "Imovel" ADD CONSTRAINT "Imovel_usufrutuarioId_fkey"
  FOREIGN KEY ("usufrutuarioId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Servico: situação do cliente neste serviço (herdeiro, inventariante, etc.)
ALTER TABLE "Servico" ADD COLUMN "situacaoProprietario" TEXT;

-- Servico <-> Cliente: confrontantes escolhidos na vinculação (pessoas já
-- cadastradas, não uma relação fixa entre imóveis)
CREATE TABLE "_ConfrontantesServico" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
ALTER TABLE "_ConfrontantesServico" ADD CONSTRAINT "_ConfrontantesServico_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ConfrontantesServico" ADD CONSTRAINT "_ConfrontantesServico_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "_ConfrontantesServico_AB_unique" ON "_ConfrontantesServico"("A", "B");
CREATE INDEX "_ConfrontantesServico_B_index" ON "_ConfrontantesServico"("B");

-- Remove o cadastro avulso de Confrontante — substituído por Cliente
-- vinculado como confrontante direto no Serviço (ver acima).
DROP TABLE "_ConfrontanteToImovel";
DROP TABLE "Confrontante";

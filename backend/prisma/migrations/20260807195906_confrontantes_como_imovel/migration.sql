-- Confrontantes do Serviço passam a ser Imóveis (não mais Clientes
-- diretamente) — o dono de cada imóvel confrontante é quem entra na
-- qualificação dos documentos.
DROP TABLE "_ConfrontantesServico";

CREATE TABLE "_ConfrontantesServico" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);
ALTER TABLE "_ConfrontantesServico" ADD CONSTRAINT "_ConfrontantesServico_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ConfrontantesServico" ADD CONSTRAINT "_ConfrontantesServico_B_fkey"
  FOREIGN KEY ("B") REFERENCES "Servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "_ConfrontantesServico_AB_unique" ON "_ConfrontantesServico"("A", "B");
CREATE INDEX "_ConfrontantesServico_B_index" ON "_ConfrontantesServico"("B");

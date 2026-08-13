-- Cliente: separa "município" (formato "Cidade - UF") em cidade + estado,
-- e adiciona bairro. Faz o backfill a partir do dado existente antes de
-- apagar a coluna antiga, para não perder endereços já cadastrados.
ALTER TABLE "Cliente" ADD COLUMN "bairro" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "cidade" TEXT;
ALTER TABLE "Cliente" ADD COLUMN "estado" TEXT;

UPDATE "Cliente"
SET
  "cidade" = NULLIF(TRIM(SPLIT_PART("municipio", '-', 1)), ''),
  "estado" = NULLIF(TRIM(SPLIT_PART("municipio", '-', 2)), '')
WHERE "municipio" IS NOT NULL;

ALTER TABLE "Cliente" DROP COLUMN "municipio";

-- Confrontante: mesma separação.
ALTER TABLE "Confrontante" ADD COLUMN "bairro" TEXT;
ALTER TABLE "Confrontante" ADD COLUMN "cidade" TEXT;
ALTER TABLE "Confrontante" ADD COLUMN "estado" TEXT;

UPDATE "Confrontante"
SET
  "cidade" = NULLIF(TRIM(SPLIT_PART("municipio", '-', 1)), ''),
  "estado" = NULLIF(TRIM(SPLIT_PART("municipio", '-', 2)), '')
WHERE "municipio" IS NOT NULL;

ALTER TABLE "Confrontante" DROP COLUMN "municipio";

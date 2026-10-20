-- AlterTable
-- Login passa a ser digitado (nome de usuário) em vez de escolhido numa lista.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "login" TEXT;

-- Contas existentes: quem é o único do setor recebe o nome do setor em
-- minúsculas — é o que se escolhia no login antigo ("des", "crd", "eng"...).
UPDATE "User" u
SET "login" = lower(r."name")
FROM "Role" r
WHERE u."roleId" = r."id"
  AND u."login" IS NULL
  AND (SELECT count(*) FROM "User" u2 WHERE u2."roleId" = u."roleId") = 1;

-- Setor com mais de uma pessoa: parte do e-mail antes do @, com um pedaço do
-- id pra não colidir. O admin pode trocar depois em Configurações → Usuários.
UPDATE "User"
SET "login" = lower(split_part("email", '@', 1)) || '-' || substr("id", 1, 4)
WHERE "login" IS NULL;

ALTER TABLE "User" ALTER COLUMN "login" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "User_login_key" ON "User"("login");

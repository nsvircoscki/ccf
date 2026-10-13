-- Ponto offline com o servidor desligado à noite e nos fins de semana:
-- sessão "só ponto" de longa duração por aparelho (revogável) e quarentena
-- para batidas que chegam mas não podem entrar no ponto (nunca descartadas).

-- CreateTable
CREATE TABLE IF NOT EXISTS "PontoSessao" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "ultimoUso" TIMESTAMP(3),
    "userAgent" TEXT,
    "revogadoEm" TIMESTAMP(3),
    "revogadoPorId" TEXT,

    CONSTRAINT "PontoSessao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PontoSessao_userId_idx" ON "PontoSessao"("userId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PontoSessao" ADD CONSTRAINT "PontoSessao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PontoBatidaQuarentena" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "funcionarioId" TEXT NOT NULL,
    "tipo" "PontoTipo" NOT NULL,
    "batidoEm" TIMESTAMP(3) NOT NULL,
    "deviceId" TEXT,
    "recebidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL,
    "situacao" TEXT NOT NULL DEFAULT 'PENDENTE',
    "decididoPorId" TEXT,
    "decididoEm" TIMESTAMP(3),

    CONSTRAINT "PontoBatidaQuarentena_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PontoBatidaQuarentena_clientId_key" ON "PontoBatidaQuarentena"("clientId");
CREATE INDEX IF NOT EXISTS "PontoBatidaQuarentena_situacao_idx" ON "PontoBatidaQuarentena"("situacao");

-- CreateTable
CREATE TABLE "Cobranca" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT,
    "clienteId" TEXT,
    "nomeCliente" TEXT NOT NULL,
    "documentoCliente" TEXT NOT NULL,
    "logradouro" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "instrucoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "seuNumero" TEXT,
    "codigoSolicitacao" TEXT,
    "caminhoPdf" TEXT,
    "erroMensagem" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cobranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaFiscal" (
    "id" TEXT NOT NULL,
    "servicoId" TEXT,
    "clienteId" TEXT,
    "empresa" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "documentoCliente" TEXT NOT NULL,
    "logradouro" TEXT,
    "cep" TEXT,
    "cidade" TEXT,
    "valor" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "numeroNfse" TEXT,
    "linkPrefeitura" TEXT,
    "caminhoPdf" TEXT,
    "erroMensagem" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaFiscal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscal" ADD CONSTRAINT "NotaFiscal_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscal" ADD CONSTRAINT "NotaFiscal_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CartorioCns" (
    "cns" TEXT NOT NULL,
    "cartorio" TEXT,
    "comarca" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartorioCns_pkey" PRIMARY KEY ("cns")
);

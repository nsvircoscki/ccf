/*
  Warnings:

  - You are about to drop the column `rgDataExpedição` on the `Cliente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "rgDataExpedição",
ADD COLUMN     "rgDataExpedicao" TIMESTAMP(3);

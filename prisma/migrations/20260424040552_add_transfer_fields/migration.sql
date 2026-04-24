-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "paymentMethod" TEXT NOT NULL DEFAULT 'mercadopago',
ADD COLUMN     "transferConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "transferExpiresAt" TIMESTAMP(3),
ADD COLUMN     "transferProofRef" TEXT;

-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "mpSurchargePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "transferAlias" TEXT;

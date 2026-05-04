-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "mpSubscriptionId" TEXT,
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" TEXT NOT NULL DEFAULT 'trial';

-- CreateTable
CREATE TABLE "BetaCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "validForDays" INTEGER NOT NULL DEFAULT 90,
    "maxRedemptions" INTEGER NOT NULL DEFAULT 1,
    "redemptionsCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BetaCodeRedemption" (
    "id" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BetaCodeRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BetaCode_code_key" ON "BetaCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BetaCodeRedemption_professionalId_key" ON "BetaCodeRedemption"("professionalId");

-- AddForeignKey
ALTER TABLE "BetaCodeRedemption" ADD CONSTRAINT "BetaCodeRedemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "BetaCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetaCodeRedemption" ADD CONSTRAINT "BetaCodeRedemption_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

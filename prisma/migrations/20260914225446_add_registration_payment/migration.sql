-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "team_registrations" ADD COLUMN     "paymentAmount" DECIMAL(65,30),
ADD COLUMN     "paymentDeadline" TIMESTAMP(3),
ADD COLUMN     "paymentReceiptKey" TEXT,
ADD COLUMN     "paymentReceiptMimeType" TEXT,
ADD COLUMN     "paymentReceiptName" TEXT,
ADD COLUMN     "paymentReceiptSize" INTEGER,
ADD COLUMN     "paymentRejectionReason" TEXT,
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
ADD COLUMN     "paymentSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "paymentVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "paymentVerifiedBy" TEXT;

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "paymentDeadline" TIMESTAMP(3),
ADD COLUMN     "registrationFeeAmount" DECIMAL(65,30);

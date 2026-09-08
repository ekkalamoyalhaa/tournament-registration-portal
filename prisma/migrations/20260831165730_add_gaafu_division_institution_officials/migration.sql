-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('UNIVERSITY', 'COLLEGE', 'HIGHER_EDUCATION_INSTITUTE');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('MENS', 'WOMENS');

-- CreateEnum
CREATE TYPE "RegistrationPhase" AS ENUM ('PHASE_1', 'PHASE_2');

-- AlterTable
ALTER TABLE "player_documents" ADD COLUMN     "officialRole" TEXT,
ALTER COLUMN "playerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "team_registrations" ADD COLUMN     "coachEmail" TEXT,
ADD COLUMN     "coachIdDocKey" TEXT,
ADD COLUMN     "coachName" TEXT,
ADD COLUMN     "coachPhone" TEXT,
ADD COLUMN     "coachPhotoKey" TEXT,
ADD COLUMN     "division" "Division",
ADD COLUMN     "managerIdDocKey" TEXT,
ADD COLUMN     "managerPhotoKey" TEXT,
ADD COLUMN     "medicEmail" TEXT,
ADD COLUMN     "medicIdDocKey" TEXT,
ADD COLUMN     "medicName" TEXT,
ADD COLUMN     "medicPhone" TEXT,
ADD COLUMN     "medicPhotoKey" TEXT,
ADD COLUMN     "officialEmail" TEXT,
ADD COLUMN     "officialIdDocKey" TEXT,
ADD COLUMN     "officialName" TEXT,
ADD COLUMN     "officialPhone" TEXT,
ADD COLUMN     "officialPhotoKey" TEXT,
ADD COLUMN     "phase" "RegistrationPhase" NOT NULL DEFAULT 'PHASE_1',
ADD COLUMN     "slotApprovedAt" TIMESTAMP(3),
ADD COLUMN     "slotApprovedBy" TEXT,
ADD COLUMN     "slotRejectionReason" TEXT;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "institutionType" "InstitutionType";

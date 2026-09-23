-- AlterTable: public doctor profiles (feature 2.1)
ALTER TABLE "doctor_profiles" ADD COLUMN "follow_up_fee_etb" DECIMAL(10,2);

ALTER TABLE "doctor_profiles" ADD COLUMN "city" TEXT;

ALTER TABLE "doctor_profiles" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "doctor_profiles" ADD COLUMN "verification_note" TEXT;

-- CreateIndex
CREATE INDEX "doctor_profiles_city_idx" ON "doctor_profiles"("city");

-- CreateIndex
CREATE INDEX "doctor_profiles_verified_idx" ON "doctor_profiles"("verified");
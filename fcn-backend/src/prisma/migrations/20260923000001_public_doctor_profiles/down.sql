-- Reverse: public doctor profiles (feature 2.1)
DROP INDEX IF EXISTS "doctor_profiles_verified_idx";

DROP INDEX IF EXISTS "doctor_profiles_city_idx";

ALTER TABLE "doctor_profiles" DROP COLUMN IF EXISTS "verification_note";

ALTER TABLE "doctor_profiles" DROP COLUMN IF EXISTS "verified";

ALTER TABLE "doctor_profiles" DROP COLUMN IF EXISTS "city";

ALTER TABLE "doctor_profiles" DROP COLUMN IF EXISTS "follow_up_fee_etb";
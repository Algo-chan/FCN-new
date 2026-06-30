-- CreateEnum
CREATE TYPE "Role" AS ENUM ('patient', 'doctor', 'nurse', 'rural_health_officer', 'hospital_admin', 'super_admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'active', 'suspended', 'rejected');

-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('dark', 'light');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'in_session', 'unavailable');

-- CreateEnum
CREATE TYPE "HospitalStatus" AS ENUM ('active', 'pending', 'inactive');

-- CreateEnum
CREATE TYPE "DataFeedType" AS ENUM ('manual', 'api');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('remote', 'in_person', 'nurse_visit');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('pending', 'confirmed', 'scheduled', 'in_session', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('active', 'refill_due', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'file', 'system');

-- CreateEnum
CREATE TYPE "PharmacyStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "fcm_token" TEXT,
    "theme_preference" "ThemePreference" NOT NULL DEFAULT 'dark',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_profiles" (
    "user_id" UUID NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "blood_type" TEXT,
    "weight_kg" DECIMAL(5,2),
    "height_cm" DECIMAL(5,2),
    "chronic_conditions" TEXT[],
    "known_allergies" TEXT,
    "home_address" TEXT,
    "home_lat" DECIMAL(10,7),
    "home_lng" DECIMAL(10,7),
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "user_id" UUID NOT NULL,
    "license_number" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "hospital_id" UUID,
    "availability_status" "AvailabilityStatus" NOT NULL DEFAULT 'unavailable',
    "bio" TEXT,
    "rating_average" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "years_experience" INTEGER NOT NULL,
    "consultation_fee_etb" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "approved_at" TIMESTAMP(3),
    "approved_by" UUID,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "nurse_profiles" (
    "user_id" UUID NOT NULL,
    "license_number" TEXT NOT NULL,
    "coverage_zone" TEXT NOT NULL,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "nurse_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "total_beds" INTEGER NOT NULL DEFAULT 0,
    "occupied_beds" INTEGER NOT NULL DEFAULT 0,
    "active_doctors_count" INTEGER NOT NULL DEFAULT 0,
    "avg_wait_minutes" INTEGER NOT NULL DEFAULT 0,
    "specialties" TEXT[],
    "status" "HospitalStatus" NOT NULL DEFAULT 'pending',
    "data_feed_type" "DataFeedType" NOT NULL DEFAULT 'manual',
    "last_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospital_admin_profiles" (
    "user_id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_admin_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "nurse_id" UUID,
    "appointment_type" "AppointmentType" NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'pending',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "chief_complaint" TEXT,
    "platform_fee_etb" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "cancellation_reason" TEXT,
    "cancelled_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_vitals" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "recorded_by_user_id" UUID NOT NULL,
    "appointment_id" UUID,
    "bp_systolic" INTEGER,
    "bp_diastolic" INTEGER,
    "blood_glucose_mg_dl" DECIMAL(6,2),
    "heart_rate_bpm" INTEGER,
    "temperature_celsius" DECIMAL(4,2),
    "spo2_percent" DECIMAL(5,2),
    "weight_kg" DECIMAL(5,2),
    "notes" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_vitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" UUID NOT NULL,
    "rx_reference" TEXT NOT NULL,
    "appointment_id" UUID,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'active',
    "qr_hash" TEXT NOT NULL,
    "notes" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "refill_count" INTEGER NOT NULL DEFAULT 0,
    "max_refills" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_medications" (
    "id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "drug_name" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "form" TEXT,
    "instructions" TEXT NOT NULL,
    "frequency_per_day" INTEGER NOT NULL DEFAULT 1,
    "reminder_times" TEXT[],
    "supply_days" INTEGER NOT NULL,
    "is_ongoing" BOOLEAN NOT NULL DEFAULT false,
    "quantity" INTEGER,

    CONSTRAINT "prescription_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "recipient_user_id" UUID NOT NULL,
    "message_text" TEXT NOT NULL,
    "message_iv" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'text',
    "file_url" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "action_url" TEXT,
    "reference_id" UUID,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "push_sent" BOOLEAN NOT NULL DEFAULT false,
    "sms_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_ratings" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "review_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "phone" TEXT,
    "opening_hours" TEXT,
    "is_partner" BOOLEAN NOT NULL DEFAULT false,
    "status" "PharmacyStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "pharmacies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_license_number_key" ON "doctor_profiles"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "nurse_profiles_license_number_key" ON "nurse_profiles"("license_number");

-- CreateIndex
CREATE INDEX "appointments_patient_id_scheduled_at_idx" ON "appointments"("patient_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_scheduled_at_idx" ON "appointments"("doctor_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "patient_vitals_patient_id_recorded_at_idx" ON "patient_vitals"("patient_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_rx_reference_key" ON "prescriptions"("rx_reference");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_qr_hash_key" ON "prescriptions"("qr_hash");

-- CreateIndex
CREATE INDEX "prescriptions_patient_id_status_idx" ON "prescriptions"("patient_id", "status");

-- CreateIndex
CREATE INDEX "messages_conversation_id_sent_at_idx" ON "messages"("conversation_id", "sent_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_created_at_idx" ON "notifications"("user_id", "read", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_ratings_appointment_id_key" ON "consultation_ratings"("appointment_id");

-- AddForeignKey
ALTER TABLE "patient_profiles" ADD CONSTRAINT "patient_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_profiles" ADD CONSTRAINT "nurse_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_admin_profiles" ADD CONSTRAINT "hospital_admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_admin_profiles" ADD CONSTRAINT "hospital_admin_profiles_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_admin_profiles" ADD CONSTRAINT "hospital_admin_profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_nurse_id_fkey" FOREIGN KEY ("nurse_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_vitals" ADD CONSTRAINT "patient_vitals_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_vitals" ADD CONSTRAINT "patient_vitals_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_vitals" ADD CONSTRAINT "patient_vitals_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_medications" ADD CONSTRAINT "prescription_medications_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_ratings" ADD CONSTRAINT "consultation_ratings_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_ratings" ADD CONSTRAINT "consultation_ratings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_ratings" ADD CONSTRAINT "consultation_ratings_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

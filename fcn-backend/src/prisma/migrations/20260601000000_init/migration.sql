-- CreateEnum
CREATE TYPE "Role" AS ENUM ('patient', 'doctor', 'nurse', 'rural_health_officer', 'hospital_admin', 'pharmacy_admin', 'super_admin');

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
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'paid', 'refunded', 'failed');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('active', 'refill_due', 'expired', 'cancelled', 'dispensed');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'file', 'system');

-- CreateEnum
CREATE TYPE "PharmacyStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RefillStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT,
    "google_id" TEXT,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "fcm_token" TEXT,
    "theme_preference" "ThemePreference" NOT NULL DEFAULT 'dark',
    "rejection_reason" TEXT,
    "suspended_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "two_fa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_fa_secret" TEXT,
    "deletion_requested_at" TIMESTAMP(3),
    "deletion_confirmed_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deletion_reason" TEXT,
    "pending_email" TEXT,
    "pending_phone" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "actor_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "target_name" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
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
    "photo_url" TEXT,
    "photo_public_id" TEXT,
    "available_since" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "approved_by" UUID,
    "show_phone" BOOLEAN NOT NULL DEFAULT false,
    "show_email" BOOLEAN NOT NULL DEFAULT false,
    "show_hospital" BOOLEAN NOT NULL DEFAULT true,
    "show_rating" BOOLEAN NOT NULL DEFAULT true,
    "show_experience" BOOLEAN NOT NULL DEFAULT true,
    "show_consultation_count" BOOLEAN NOT NULL DEFAULT true,
    "languages_spoken" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clinic_address" TEXT,
    "consultation_types" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "nurse_profiles" (
    "user_id" UUID NOT NULL,
    "license_number" TEXT NOT NULL,
    "coverage_zone" TEXT NOT NULL,
    "years_experience" INTEGER NOT NULL DEFAULT 0,
    "approved_at" TIMESTAMP(3),
    "approved_by" UUID,

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
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
    "payment_tx_ref" TEXT,
    "chapa_checkout_url" TEXT,
    "reschedule_count" INTEGER NOT NULL DEFAULT 0,
    "rescheduled_from" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "cancelled_by" UUID,
    "cancelled_by_role" TEXT,
    "actual_start_time" TIMESTAMP(3),
    "actual_end_time" TIMESTAMP(3),
    "consultation_started_at" TIMESTAMP(3),
    "consultation_ended_at" TIMESTAMP(3),
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "follow_up_prescription_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_reschedule_history" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "old_scheduled_at" TIMESTAMP(3) NOT NULL,
    "new_scheduled_at" TIMESTAMP(3) NOT NULL,
    "rescheduled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rescheduled_by" UUID NOT NULL,
    "reason" TEXT,

    CONSTRAINT "appointment_reschedule_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_logs" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "tx_ref" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "chapa_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_logs_pkey" PRIMARY KEY ("id")
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
    "height_cm" DECIMAL(5,2),
    "bmi" DECIMAL(4,1),
    "vital_source" TEXT NOT NULL DEFAULT 'self',
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagged_reasons" TEXT[],
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
    "dispensed_at" TIMESTAMP(3),
    "dispensed_by_pharmacy_id" UUID,
    "dispense_count" INTEGER NOT NULL DEFAULT 0,

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
    "reminder_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_reminder_sent" TIMESTAMP(3),

    CONSTRAINT "prescription_medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacy_admin_profiles" (
    "user_id" UUID NOT NULL,
    "pharmacy_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacy_admin_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "hospital_pharmacy_links" (
    "id" UUID NOT NULL,
    "hospital_id" UUID NOT NULL,
    "pharmacy_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hospital_pharmacy_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispense_records" (
    "id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "pharmacy_id" UUID NOT NULL,
    "dispensed_by" UUID NOT NULL,
    "dispensed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "medications_dispensed" TEXT[],

    CONSTRAINT "dispense_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refill_requests" (
    "id" UUID NOT NULL,
    "prescription_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "status" "RefillStatus" NOT NULL DEFAULT 'PENDING',
    "patient_note" TEXT,
    "doctor_note" TEXT,
    "new_prescription_id" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "refill_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "recipient_user_id" UUID NOT NULL,
    "message_text" TEXT NOT NULL,
    "message_iv" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'text',
    "file_url" TEXT,
    "file_type" TEXT,
    "file_name" TEXT,
    "file_size_bytes" INTEGER,
    "is_system_message" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

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
    "group_type" VARCHAR(50),
    "priority" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "expires_at" TIMESTAMP(3),
    "image_url" TEXT,
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
CREATE TABLE "two_fa_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "otp" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "two_fa_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "symptom_assessments" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "language" TEXT NOT NULL,
    "initial_symptoms" TEXT NOT NULL,
    "conversation" JSONB NOT NULL,
    "round_count" INTEGER NOT NULL DEFAULT 0,
    "risk_level" TEXT,
    "recommended_specialty" TEXT,
    "final_assessment" TEXT,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "booking_initiated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "symptom_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pharmacies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "phone" TEXT,
    "email" TEXT,
    "opening_hours" TEXT,
    "license_number" TEXT NOT NULL,
    "status" "PharmacyStatus" NOT NULL DEFAULT 'PENDING',
    "is_partner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pharmacies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurse_visit_checklists" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "completed_items" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurse_visit_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_notes" (
    "id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "appointment_id" UUID,
    "note_text" TEXT NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultation_summaries" (
    "id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "prescription_issued" BOOLEAN NOT NULL DEFAULT false,
    "prescription_id" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "summary_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultation_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "activity_logs_actor_id_created_at_idx" ON "activity_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_action_created_at_idx" ON "activity_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_license_number_key" ON "doctor_profiles"("license_number");

-- CreateIndex
CREATE INDEX "doctor_profiles_specialty_idx" ON "doctor_profiles"("specialty");

-- CreateIndex
CREATE INDEX "doctor_profiles_availability_status_idx" ON "doctor_profiles"("availability_status");

-- CreateIndex
CREATE UNIQUE INDEX "nurse_profiles_license_number_key" ON "nurse_profiles"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_payment_tx_ref_key" ON "appointments"("payment_tx_ref");

-- CreateIndex
CREATE INDEX "appointments_patient_id_scheduled_at_idx" ON "appointments"("patient_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_scheduled_at_idx" ON "appointments"("doctor_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "appointments_payment_tx_ref_idx" ON "appointments"("payment_tx_ref");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_patient_id_status_idx" ON "appointments"("patient_id", "status");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_status_idx" ON "appointments"("doctor_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "appointment_reschedule_history_appointment_id_idx" ON "appointment_reschedule_history"("appointment_id");

-- CreateIndex
CREATE INDEX "payment_logs_appointment_id_idx" ON "payment_logs"("appointment_id");

-- CreateIndex
CREATE INDEX "payment_logs_tx_ref_idx" ON "payment_logs"("tx_ref");

-- CreateIndex
CREATE INDEX "patient_vitals_patient_id_recorded_at_idx" ON "patient_vitals"("patient_id", "recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_rx_reference_key" ON "prescriptions"("rx_reference");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_qr_hash_key" ON "prescriptions"("qr_hash");

-- CreateIndex
CREATE INDEX "prescriptions_patient_id_status_idx" ON "prescriptions"("patient_id", "status");

-- CreateIndex
CREATE INDEX "prescriptions_doctor_id_status_idx" ON "prescriptions"("doctor_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hospital_pharmacy_links_hospital_id_pharmacy_id_key" ON "hospital_pharmacy_links"("hospital_id", "pharmacy_id");

-- CreateIndex
CREATE INDEX "dispense_records_prescription_id_idx" ON "dispense_records"("prescription_id");

-- CreateIndex
CREATE INDEX "dispense_records_pharmacy_id_idx" ON "dispense_records"("pharmacy_id");

-- CreateIndex
CREATE INDEX "refill_requests_prescription_id_idx" ON "refill_requests"("prescription_id");

-- CreateIndex
CREATE INDEX "refill_requests_doctor_id_status_idx" ON "refill_requests"("doctor_id", "status");

-- CreateIndex
CREATE INDEX "messages_conversation_id_sent_at_idx" ON "messages"("conversation_id", "sent_at");

-- CreateIndex
CREATE INDEX "messages_appointment_id_sent_at_idx" ON "messages"("appointment_id", "sent_at");

-- CreateIndex
CREATE INDEX "messages_recipient_user_id_read_at_idx" ON "messages"("recipient_user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_created_at_idx" ON "notifications"("user_id", "read", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_group_type_created_at_idx" ON "notifications"("user_id", "group_type", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_priority_idx" ON "notifications"("user_id", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_ratings_appointment_id_key" ON "consultation_ratings"("appointment_id");

-- CreateIndex
CREATE INDEX "two_fa_sessions_user_id_purpose_idx" ON "two_fa_sessions"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "symptom_assessments_patient_id_idx" ON "symptom_assessments"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "pharmacies_license_number_key" ON "pharmacies"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "nurse_visit_checklists_appointment_id_key" ON "nurse_visit_checklists"("appointment_id");

-- CreateIndex
CREATE INDEX "doctor_notes_doctor_id_patient_id_idx" ON "doctor_notes"("doctor_id", "patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "consultation_summaries_appointment_id_key" ON "consultation_summaries"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_entries_email_key" ON "waitlist_entries"("email");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "nurse_profiles" ADD CONSTRAINT "nurse_profiles_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "appointment_reschedule_history" ADD CONSTRAINT "appointment_reschedule_history_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_dispensed_by_pharmacy_id_fkey" FOREIGN KEY ("dispensed_by_pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_medications" ADD CONSTRAINT "prescription_medications_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_admin_profiles" ADD CONSTRAINT "pharmacy_admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_admin_profiles" ADD CONSTRAINT "pharmacy_admin_profiles_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pharmacy_admin_profiles" ADD CONSTRAINT "pharmacy_admin_profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_pharmacy_links" ADD CONSTRAINT "hospital_pharmacy_links_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_pharmacy_links" ADD CONSTRAINT "hospital_pharmacy_links_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "pharmacies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispense_records" ADD CONSTRAINT "dispense_records_dispensed_by_fkey" FOREIGN KEY ("dispensed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refill_requests" ADD CONSTRAINT "refill_requests_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_ratings" ADD CONSTRAINT "consultation_ratings_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_ratings" ADD CONSTRAINT "consultation_ratings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_ratings" ADD CONSTRAINT "consultation_ratings_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_fa_sessions" ADD CONSTRAINT "two_fa_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "symptom_assessments" ADD CONSTRAINT "symptom_assessments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_visit_checklists" ADD CONSTRAINT "nurse_visit_checklists_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_notes" ADD CONSTRAINT "doctor_notes_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_notes" ADD CONSTRAINT "doctor_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_notes" ADD CONSTRAINT "doctor_notes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_summaries" ADD CONSTRAINT "consultation_summaries_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

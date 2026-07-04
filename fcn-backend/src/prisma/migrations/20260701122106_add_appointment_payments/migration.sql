/*
  Warnings:

  - A unique constraint covering the columns `[payment_tx_ref]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'paid', 'refunded', 'failed');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "actual_end_time" TIMESTAMP(3),
ADD COLUMN     "actual_start_time" TIMESTAMP(3),
ADD COLUMN     "cancelled_by_role" TEXT,
ADD COLUMN     "chapa_checkout_url" TEXT,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'unpaid',
ADD COLUMN     "payment_tx_ref" TEXT,
ADD COLUMN     "reschedule_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rescheduled_from" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "doctor_profiles" ADD COLUMN     "available_since" TIMESTAMP(3),
ADD COLUMN     "photo_public_id" TEXT,
ADD COLUMN     "photo_url" TEXT;

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

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "appointment_reschedule_history_appointment_id_idx" ON "appointment_reschedule_history"("appointment_id");

-- CreateIndex
CREATE INDEX "payment_logs_appointment_id_idx" ON "payment_logs"("appointment_id");

-- CreateIndex
CREATE INDEX "payment_logs_tx_ref_idx" ON "payment_logs"("tx_ref");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_payment_tx_ref_key" ON "appointments"("payment_tx_ref");

-- CreateIndex
CREATE INDEX "appointments_payment_tx_ref_idx" ON "appointments"("payment_tx_ref");

-- AddForeignKey
ALTER TABLE "appointment_reschedule_history" ADD CONSTRAINT "appointment_reschedule_history_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_logs" ADD CONSTRAINT "payment_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

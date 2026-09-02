import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// eslint-disable-next-line no-undef
const DEFAULT_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

async function main() {
  console.log("Seeding database...");

  if (!DEFAULT_ADMIN_PASSWORD) {
    console.warn(
      "  ⛔  SEED_ADMIN_PASSWORD env var is not set. " +
        "Refusing to set the super admin password from a hardcoded default.\n" +
        "  To seed correctly, run:\n" +
        "    SEED_ADMIN_PASSWORD='<strong random password>' npm run db:seed\n" +
        "  The super admin user will NOT be modified this run."
    );
  } else {
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);

    await prisma.user.upsert({
      where: { email: "admin@fcncare.com" },
      update: {
        password_hash: passwordHash
      },
      create: {
        full_name: "FCN Super Admin",
        email: "admin@fcncare.com",
        phone: "+251911000000",
        password_hash: passwordHash,
        role: "super_admin",
        status: "active",
        email_verified: true,
        phone_verified: false
      }
    });
    console.log("Super admin password updated from SEED_ADMIN_PASSWORD env var.");
    console.log("  ⚠️  After first login, change password at Profile → Security → Change Password.");
    console.log("  ⚠️  Never use the default password in production.");
  }

  const systemSettingsData = [
    { key: "free_period_ends_at", value: "2025-08-01T00:00:00.000Z", description: "End date of free trial period" },
    { key: "payment_enabled", value: "false", description: "Master switch for payment processing" },
    { key: "default_consultation_fee_etb", value: "50", description: "Default doctor consultation fee" },
    { key: "platform_fee_percent", value: "10", description: "Platform fee as percentage of consultation fee" },
    { key: "max_reschedule_count", value: "3", description: "Maximum number of reschedules per appointment" },
    { key: "appointment_duration_minutes", value: "30", description: "Default appointment duration" },
    { key: "max_appointments_per_slot", value: "1", description: "Maximum appointments per time slot" },
    { key: "message_retention_days", value: "30", description: "Number of days to keep consultation messages before auto-deletion" },
    { key: "consultation_summary_enabled", value: "true", description: "Enable automatic consultation summary creation" },
    { key: "ai_triage_enabled", value: "true", description: "Enable AI symptom checker triage" },
    { key: "ai_max_rounds", value: "3", description: "Maximum conversation rounds for AI triage" },
    { key: "ai_model", value: "deepseek-v4-flash", description: "DeepSeek model for AI triage" },
    { key: "prescription_qr_secret", value: process.env.SEED_QR_SECRET || "CHANGE_ME_prescription_qr_secret", description: "Secret key for QR code HMAC verification" },
    { key: "medication_reminders_enabled", value: "true", description: "Enable medication reminder push notifications" },
    { key: "notification_retention_days", value: "90", description: "Number of days to keep read notifications before auto-deletion" },
    { key: "fcm_enabled", value: "true", description: "Enable Firebase Cloud Messaging push notifications" },
    { key: "sms_enabled", value: "false", description: "Enable SMS notifications via Twilio" }
  ];

  for (const setting of systemSettingsData) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value, description: setting.description }
    });
  }
  console.log("System settings seeded.");

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

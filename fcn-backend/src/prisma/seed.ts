import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("TestPass123", 12);

  const superAdminUser = await prisma.user.upsert({
    where: { email: "superadmin@fcn.health" },
    update: {},
    create: {
      full_name: "FCN Super Admin",
      email: "superadmin@fcn.health",
      phone: "+251911000000",
      password_hash: await bcrypt.hash("SuperAdmin123!", 12),
      role: "super_admin",
      status: "active",
      email_verified: true,
      phone_verified: false
    }
  });
  console.log(`Super admin: ${superAdminUser.email}`);

  const adminUserSeed = await prisma.user.upsert({
    where: { email: "admin@fcncare.com" },
    update: {},
    create: {
      full_name: "FCN Administrator",
      email: "admin@fcncare.com",
      phone: "+251900000000",
      password_hash: await bcrypt.hash("FCN@Admin2026!", 12),
      role: "super_admin",
      status: "active",
      email_verified: true,
      phone_verified: true
    }
  });
  console.log(`Admin seed: ${adminUserSeed.email}`);
  console.log("  ⚠️  After first login, change password at Profile → Security → Change Password.");
  console.log("  ⚠️  Never use the default password in production.");

  // ── Pharmacy Seed Data ──────────────────────────────────────────

  const sabianPharmacy = await prisma.pharmacy.upsert({
    where: { license_number: "ETH-PHARM-DD-001" },
    update: {},
    create: {
      name: "Sabian Pharmacy",
      location: "Sabian, Dire Dawa",
      lat: 9.6010,
      lng: 41.8550,
      phone: "+251251112233",
      opening_hours: "Mon-Sat 8:00AM-10:00PM, Sun 9:00AM-8:00PM",
      license_number: "ETH-PHARM-DD-001",
      status: "ACTIVE",
      is_partner: true
    }
  });
  console.log(`Pharmacy: ${sabianPharmacy.name}`);

  const direDawaPharmacy = await prisma.pharmacy.upsert({
    where: { license_number: "ETH-PHARM-DD-002" },
    update: {},
    create: {
      name: "Dire Dawa Pharmacy",
      location: "Kezira, Dire Dawa",
      lat: 9.5931,
      lng: 41.8661,
      phone: "+251251223344",
      opening_hours: "Daily 7:00AM-11:00PM",
      license_number: "ETH-PHARM-DD-002",
      status: "ACTIVE",
      is_partner: true
    }
  });
  console.log(`Pharmacy: ${direDawaPharmacy.name}`);

  const jugolMedicalStore = await prisma.pharmacy.upsert({
    where: { license_number: "ETH-PHARM-DD-003" },
    update: {},
    create: {
      name: "Jugol Medical Store",
      location: "Jugol, Dire Dawa",
      lat: 9.5880,
      lng: 41.8720,
      phone: "+251251334455",
      opening_hours: "Mon-Sat 8:30AM-9:00PM",
      license_number: "ETH-PHARM-DD-003",
      status: "ACTIVE",
      is_partner: true
    }
  });
  console.log(`Pharmacy: ${jugolMedicalStore.name}`);

  const harambePharmacy = await prisma.pharmacy.upsert({
    where: { license_number: "ETH-PHARM-DD-004" },
    update: {},
    create: {
      name: "Harambe Pharmacy",
      location: "Addis Ketema, Dire Dawa",
      lat: 9.5950,
      lng: 41.8600,
      phone: "+251251445566",
      opening_hours: "Daily 8:00AM-10:00PM",
      license_number: "ETH-PHARM-DD-004",
      status: "PENDING",
      is_partner: false
    }
  });
  console.log(`Pharmacy: ${harambePharmacy.name}`);

  // ── Test Pharmacy Admin ──────────────────────────────────────────

  const pharmacyAdminEmail = "pharmacist@sabianpharmacy.fcn.health";
  let pharmacyAdminUser = await prisma.user.findUnique({ where: { email: pharmacyAdminEmail } });

  if (!pharmacyAdminUser) {
    pharmacyAdminUser = await prisma.user.create({
      data: {
        full_name: "Pharmacist Test Account",
        email: pharmacyAdminEmail,
        phone: "+251911000002",
        password_hash: passwordHash,
        role: "pharmacy_admin",
        status: "active",
        email_verified: true,
        phone_verified: false
      }
    });
    console.log(`Pharmacy admin user created: ${pharmacyAdminUser.email}`);
  } else {
    console.log(`Pharmacy admin user exists: ${pharmacyAdminUser.email}`);
  }

  const existingPharmacyProfile = await prisma.pharmacyAdminProfile.findUnique({ where: { user_id: pharmacyAdminUser.id } });
  if (!existingPharmacyProfile) {
    await prisma.pharmacyAdminProfile.create({
      data: {
        user_id: pharmacyAdminUser.id,
        pharmacy_id: sabianPharmacy.id,
        created_by: superAdminUser.id
      }
    });
    console.log(`PharmacyAdminProfile created for: ${pharmacyAdminUser.email}`);
  } else {
    console.log(`PharmacyAdminProfile already exists for: ${pharmacyAdminUser.email}`);
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
    { key: "ai_model", value: "claude-sonnet-4-6", description: "Anthropic Claude model for AI triage" },
    { key: "prescription_qr_secret", value: "change_this_in_production", description: "Secret key for QR code HMAC verification" },
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

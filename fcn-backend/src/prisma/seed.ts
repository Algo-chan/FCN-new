import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const direDawaGeneral = await prisma.hospital.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Dire Dawa General Hospital",
      location: "Kezira, Dire Dawa",
      lat: 9.5931,
      lng: 41.8661,
      total_beds: 180,
      occupied_beds: 142,
      active_doctors_count: 24,
      avg_wait_minutes: 65,
      specialties: ["General Medicine", "Surgery", "Pediatrics", "Obstetrics", "Emergency"],
      status: "active",
      data_feed_type: "manual"
    }
  });
  console.log(`Hospital: ${direDawaGeneral.name}`);

  const sabianHealthCenter = await prisma.hospital.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Sabian Health Center",
      location: "Sabian, Dire Dawa",
      lat: 9.601,
      lng: 41.855,
      total_beds: 60,
      occupied_beds: 21,
      active_doctors_count: 8,
      avg_wait_minutes: 20,
      specialties: ["General Medicine", "Pediatrics"],
      status: "active",
      data_feed_type: "manual"
    }
  });
  console.log(`Hospital: ${sabianHealthCenter.name}`);

  const jugolClinic = await prisma.hospital.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Jugol Clinic",
      location: "Jugol, Dire Dawa",
      lat: 9.588,
      lng: 41.872,
      total_beds: 25,
      occupied_beds: 4,
      active_doctors_count: 4,
      avg_wait_minutes: 10,
      specialties: ["General Medicine"],
      status: "pending",
      data_feed_type: "manual"
    }
  });
  console.log(`Hospital: ${jugolClinic.name}`);

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

  const hospitalAdminEmail = "admin@diredawagen.fcn.health";

  let adminUser = await prisma.user.findUnique({ where: { email: hospitalAdminEmail } });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        full_name: "Dire Dawa General Admin",
        email: hospitalAdminEmail,
        phone: "+251911000001",
        password_hash: passwordHash,
        role: "hospital_admin",
        status: "active",
        email_verified: true,
        phone_verified: false
      }
    });
    console.log(`Hospital admin user created: ${adminUser.email}`);
  } else {
    console.log(`Hospital admin user exists: ${adminUser.email}`);
  }

  const existingProfile = await prisma.hospitalAdminProfile.findUnique({ where: { user_id: adminUser.id } });
  if (!existingProfile) {
    await prisma.hospitalAdminProfile.create({
      data: {
        user_id: adminUser.id,
        hospital_id: direDawaGeneral.id,
        created_by: superAdminUser.id
      }
    });
    console.log(`HospitalAdminProfile created for: ${adminUser.email}`);
  } else {
    console.log(`HospitalAdminProfile already exists for: ${adminUser.email}`);
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
    { key: "consultation_summary_enabled", value: "true", description: "Enable automatic consultation summary creation" }
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

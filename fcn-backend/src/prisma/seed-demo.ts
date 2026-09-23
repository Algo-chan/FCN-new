import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

/**
 * DEV-ONLY demo seed for local testing.
 *
 * Creates sample hospitals, doctors (with public profiles) and a demo patient
 * so you can exercise the app without real registrations.
 *
 * Run:  npm run db:seed-demo
 *
 * Demo accounts (dev only):
 *   doctor  demo.doctor1@fcncare.com / Doctor@123
 *   patient demo.patient@fcncare.com / Patient@123
 *
 * Safe to run multiple times (idempotent via upsert).
 */

const prisma = new PrismaClient();

const DOCTOR_PASSWORD = "Doctor@123";
const PATIENT_PASSWORD = "Patient@123";

const DOCTORS = [
  {
    email: "demo.doctor1@fcncare.com",
    full_name: "Abebe Bekele",
    license_number: "LN-DEMO-0001",
    specialty: "General Medicine",
    hospital: "Dil Chora Hospital",
    city: "Dire Dawa",
    verified: true,
    availability_status: "available" as const,
    years_experience: 12,
    consultation_fee_etb: 350,
    follow_up_fee_etb: 150,
    rating_average: 4.6,
    rating_count: 21,
    languages_spoken: ["English", "አማርኛ"],
    bio: "General practitioner focused on preventive care and chronic disease management."
  },
  {
    email: "demo.doctor2@fcncare.com",
    full_name: "Sara Tadesse",
    license_number: "LN-DEMO-0002",
    specialty: "Pediatrics",
    hospital: "Dil Chora Hospital",
    city: "Dire Dawa",
    verified: true,
    availability_status: "in_session" as const,
    years_experience: 9,
    consultation_fee_etb: 400,
    follow_up_fee_etb: 200,
    rating_average: 4.8,
    rating_count: 34,
    languages_spoken: ["English", "አማርኛ"],
    bio: "Pediatrician with 9 years of experience in newborn and child care."
  },
  {
    email: "demo.doctor3@fcncare.com",
    full_name: "Dawit Hailu",
    license_number: "LN-DEMO-0003",
    specialty: "Cardiology",
    hospital: "Addis Tip International Specialized Hospital",
    city: "Addis Ababa",
    verified: false,
    availability_status: "available" as const,
    years_experience: 15,
    consultation_fee_etb: 600,
    follow_up_fee_etb: 300,
    rating_average: 4.9,
    rating_count: 47,
    languages_spoken: ["English"],
    bio: "Interventional cardiologist. Available for remote cardiac consultations."
  },
  {
    email: "demo.doctor4@fcncare.com",
    full_name: "Helen Girma",
    license_number: "LN-DEMO-0004",
    specialty: "Dermatology",
    hospital: null,
    city: "Dire Dawa",
    verified: true,
    availability_status: "unavailable" as const,
    years_experience: 7,
    consultation_fee_etb: 450,
    follow_up_fee_etb: null,
    rating_average: 4.4,
    rating_count: 12,
    languages_spoken: ["አማርኛ"],
    bio: "Dermatologist treating skin conditions, allergies and cosmetic concerns."
  },
  {
    email: "demo.doctor5@fcncare.com",
    full_name: "Muluken Assefa",
    license_number: "LN-DEMO-0005",
    specialty: "General Surgery",
    hospital: "Addis Tip International Specialized Hospital",
    city: "Dire Dawa",
    verified: true,
    availability_status: "available" as const,
    years_experience: 18,
    consultation_fee_etb: 500,
    follow_up_fee_etb: 200,
    rating_average: 4.7,
    rating_count: 29,
    languages_spoken: ["English", "አማርኛ", "Soomaali"],
    bio: "General surgeon with post-operative consultation and follow-up care."
  },
  {
    email: "demo.doctor6@fcncare.com",
    full_name: "Eyerusalem Mekonnen",
    license_number: "LN-DEMO-0006",
    specialty: "Internal Medicine",
    hospital: "Addis Tip International Specialized Hospital",
    city: "Addis Ababa",
    verified: true,
    availability_status: "available" as const,
    years_experience: 11,
    consultation_fee_etb: 300,
    follow_up_fee_etb: null,
    rating_average: 4.5,
    rating_count: 18,
    languages_spoken: ["English", "አማርኛ"],
    bio: "Internist specializing in diabetes, hypertension and long-term follow-up."
  }
];

async function main(): Promise<void> {
  console.log("Seeding demo data...");

  const doctorHash = await bcrypt.hash(DOCTOR_PASSWORD, 12);
  const patientHash = await bcrypt.hash(PATIENT_PASSWORD, 12);

  const hospitalNames = [...new Set(DOCTORS.map((d) => d.hospital).filter((h): h is string => Boolean(h)))];
  const hospitalRecords = new Map<string, string>();

  for (const name of hospitalNames) {
    let hospital = await prisma.hospital.findFirst({ where: { name } });
    if (!hospital) {
      hospital = await prisma.hospital.create({
        data: {
          name,
          location: "Dire Dawa, Ethiopia",
          status: "active",
          specialties: ["General Medicine", "Pediatrics", "Cardiology", "Internal Medicine", "General Surgery"]
        }
      });
    }
    hospitalRecords.set(name, hospital.id);
    console.log(`  hospital: ${name}`);
  }

  for (const d of DOCTORS) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {
        full_name: d.full_name,
        status: "active",
        email_verified: true,
        password_hash: doctorHash
      },
      create: {
        full_name: d.full_name,
        email: d.email,
        password_hash: doctorHash,
        role: "doctor",
        status: "active",
        email_verified: true
      }
    });

    await prisma.doctorProfile.upsert({
      where: { user_id: user.id },
      update: {
        specialty: d.specialty,
        hospital_id: d.hospital ? hospitalRecords.get(d.hospital) : null,
        city: d.city,
        verified: d.verified,
        availability_status: d.availability_status,
        years_experience: d.years_experience,
        consultation_fee_etb: d.consultation_fee_etb,
        follow_up_fee_etb: d.follow_up_fee_etb,
        rating_average: d.rating_average,
        rating_count: d.rating_count,
        languages_spoken: d.languages_spoken,
        bio: d.bio
      },
      create: {
        user_id: user.id,
        license_number: d.license_number,
        specialty: d.specialty,
        hospital_id: d.hospital ? hospitalRecords.get(d.hospital) : null,
        city: d.city,
        verified: d.verified,
        availability_status: d.availability_status,
        years_experience: d.years_experience,
        consultation_fee_etb: d.consultation_fee_etb,
        follow_up_fee_etb: d.follow_up_fee_etb,
        rating_average: d.rating_average,
        rating_count: d.rating_count,
        languages_spoken: d.languages_spoken,
        bio: d.bio,
        approved_at: new Date(),
        consultation_types: ["remote", "in_person"]
      }
    });
    console.log(`  doctor: ${d.full_name} (${d.email})`);
  }

  const patient = await prisma.user.upsert({
    where: { email: "demo.patient@fcncare.com" },
    update: {
      full_name: "Dagem Tesfaye",
      status: "active",
      email_verified: true,
      password_hash: patientHash
    },
    create: {
      full_name: "Dagem Tesfaye",
      email: "demo.patient@fcncare.com",
      password_hash: patientHash,
      role: "patient",
      status: "active",
      email_verified: true
    }
  });

  await prisma.patientProfile.upsert({
    where: { user_id: patient.id },
    update: { onboarding_completed: true },
    create: {
      user_id: patient.id,
      onboarding_completed: true,
      chronic_conditions: []
    }
  });
  console.log("  patient: Dagem Tesfaye (demo.patient@fcncare.com)");

  console.log("\nDone. Demo accounts:");
  console.log("  doctors : demo.doctorN@fcncare.com / Doctor@123");
  console.log("  patient : demo.patient@fcncare.com / Patient@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
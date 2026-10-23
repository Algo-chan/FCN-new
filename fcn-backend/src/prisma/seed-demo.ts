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

  // Demo Articles for Doctor Articles & SEO Engine
  const drAbebe = await prisma.user.findUnique({ where: { email: "demo.doctor1@fcncare.com" } });
  const drSara = await prisma.user.findUnique({ where: { email: "demo.doctor2@fcncare.com" } });
  const drDawit = await prisma.user.findUnique({ where: { email: "demo.doctor3@fcncare.com" } });
  const drHelen = await prisma.user.findUnique({ where: { email: "demo.doctor4@fcncare.com" } });

  if (drAbebe && drSara && drDawit && drHelen) {
    const demoArticles = [
      {
        slug: "managing-diabetes-in-ethiopia-dietary-habits-teff-and-blood-glucose",
        title: "Managing Diabetes in Ethiopia: Dietary Habits, Teff, and Blood Glucose",
        excerpt: "An evidence-based clinical guide for Ethiopian patients navigating diabetes management while enjoying traditional staple foods like injera, lentils, and local vegetables.",
        category: "General Medicine",
        author_id: drAbebe.id,
        status: "published" as const,
        views_count: 342,
        reading_time_minutes: 6,
        published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        cover_image_url: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
        content: `## The Modern Landscape of Diabetes in Ethiopia

Diabetes mellitus is rapidly increasing across Ethiopian urban and semi-urban populations. Traditionally regarded as an uncommon illness in our highlands, shifting dietary habits, higher consumption of refined carbohydrates, and more sedentary urban lifestyles have elevated Type 2 Diabetes into a primary chronic condition managed in Ethiopian outpatient clinics.

### Can Patients with Diabetes Still Eat Injera?

The most common question I receive from newly diagnosed patients in Dire Dawa and Addis Ababa is: *"Doctor, do I have to stop eating Injera?"*

The short answer is **no**, but the type of grain and portion control matters significantly:
- **100% Pure Teff Injera**: Teff has a lower glycemic index compared to wheat or maize. Its high fiber content slows carbohydrate breakdown, leading to smoother postprandial glucose curves.
- **Mixed Injera (Teff blended with wheat or rice)**: Many commercial bakeries mix teff with refined white wheat flour to lower production costs. This significantly increases the glycemic index. Patients should inquire about the flour purity or prepare injera at home.

### Practical Steps for Daily Blood Sugar Control

1. **Prioritize Fiber and Legumes First**: When dining, eat your shiro, misir (red lentils), and green vegetables (*gomen*) first before consuming large portions of the injera base.
2. **Beware of Hidden Sugars in Hot Beverages**: Ethiopian tea (*shai*) is culturally served with heavy scoops of cane sugar. Train your palate to drink black tea or spiced tea with no added sweetener.
3. **Daily Brisk Walking**: A 30-minute brisk walk after your evening meal significantly enhances insulin sensitivity.

> **Clinical Disclaimer:** This guide is for educational awareness and does not replace personalized clinical advice. Consult your physician for individualized medication adjustments and laboratory HbA1c targets.`
      },
      {
        slug: "pediatric-fever-and-dehydration-when-to-seek-emergency-care",
        title: "Pediatric Fever & Dehydration: When to Seek Immediate Emergency Care",
        excerpt: "Essential clinical instructions for parents on managing childhood fevers safely at home and recognizing the danger signs of severe dehydration in young infants.",
        category: "Pediatrics",
        author_id: drSara.id,
        status: "published" as const,
        views_count: 518,
        reading_time_minutes: 5,
        published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        cover_image_url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
        content: `## Understanding Fever in Children

A fever is not a disease in itself; it is your child's immune system actively mounting a defense against bacterial or viral pathogens. However, rapid temperature spikes in children under 5 years can quickly lead to dehydration and discomfort.

### Critical Warning Signs (Red Flags)

Seek urgent hospital or clinic evaluation immediately if your child displays any of the following symptoms:
- Sunken eyes or sunken fontanelle (the soft spot on an infant's head)
- Inability to drink liquids or keep any oral rehydration down
- Lethargy, extreme floppiness, or difficulty waking up
- Very fast or grunting breathing with chest indrawing
- Absence of wet diapers for more than 6 consecutive hours

### Safe Home Care & Oral Rehydration Solution (ORS)

When treating mild fever and diarrhea at home:
1. **Never withhold fluids**: Continue frequent breastfeeding or small, regular sips of clean boiled water with standard ORS packets.
2. **Avoid cold water sponging**: Tepid, room-temperature sponge baths are safer. Cold water can induce shivering, which paradoxically drives internal body temperatures higher.
3. **Accurate paracetamol dosing**: Administer paracetamol based on your child's body weight, NOT their age. Always consult with a doctor or licensed pharmacist to calculate the exact milligram dosage.

> **Specialist Note:** If an infant under 3 months develops a rectal temperature of 38°C (100.4°F) or above, immediate emergency physician evaluation is mandatory.`
      },
      {
        slug: "recognizing-silent-warning-signs-of-hypertension-in-urban-ethiopia",
        title: "Recognizing Silent Warning Signs of Hypertension in Urban Ethiopia",
        excerpt: "Why high blood pressure is dubbed the silent killer, common misconceptions about headache symptoms, and how routine blood pressure checks prevent heart disease.",
        category: "Cardiology",
        author_id: drDawit.id,
        status: "published" as const,
        views_count: 289,
        reading_time_minutes: 7,
        published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        cover_image_url: "https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?auto=format&fit=crop&w=1200&q=80",
        content: `## The "Silent Killer" Myth vs Reality

In cardiovascular medicine, hypertension is universally termed the *Silent Killer* because severe vascular damage occurs over years without triggering overt symptoms. Many patients believe they only need blood pressure medication when they feel an occipital headache or neck stiffness.

This is a dangerous misconception: **most patients with stage 2 hypertension feel completely normal until an acute stroke, heart failure, or renal impairment strikes.**

### Understanding Blood Pressure Numbers

- **Normal**: Systolic < 120 mmHg and Diastolic < 80 mmHg
- **Elevated**: Systolic 120–129 mmHg and Diastolic < 80 mmHg
- **Stage 1 Hypertension**: Systolic 130–139 mmHg or Diastolic 80–89 mmHg
- **Stage 2 Hypertension**: Systolic ≥ 140 mmHg or Diastolic ≥ 90 mmHg

### Salt and the Ethiopian Palate

Traditional Ethiopian stews (*wots*) often incorporate generous amounts of berbere paste, salt, and clarified butter (*niter kibbeh*). While culturally cherished, excess sodium draws water into the bloodstream, elevating vascular resistance.

### Recommended Lifestyle Interventions

1. Check your blood pressure at least once every month at any local pharmacy or clinic.
2. Moderate sodium intake by reducing added salt in home cooking.
3. Schedule regular cardiovascular reviews if you have a family history of early heart attack or stroke.`
      },
      {
        slug: "skin-rashes-in-humid-climates-identification-and-first-aid",
        title: "Skin Rashes in Humid Climates: Identification and First Aid",
        excerpt: "A clinical guide to differentiating fungal infections from allergic contact dermatitis during humid seasonal transitions.",
        category: "Dermatology",
        author_id: drHelen.id,
        status: "pending_review" as const,
        views_count: 0,
        reading_time_minutes: 4,
        published_at: null,
        cover_image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
        content: `## Heat Rash vs Fungal Ringworm (Tinea)

During humid months, dermatological presentations spike significantly across Ethiopian outpatient clinics. Misdiagnosis often leads patients to apply topical corticosteroid creams onto active fungal infections, creating a widespread condition known as *Tinea Incognito*.

### Identifying Characteristic Features

- **Tinea Corporis**: Annular (ring-shaped) lesions with raised, scaly active borders and central clearing. Often intensely pruritic.
- **Miliaria (Heat Rash)**: Pinhead-sized clear or erythematous vesicles located on sweat-rich regions such as the chest, neck, and skin folds.

### Do Not Self-Medicate with Triple Combination Creams

Over-the-counter creams combining antifungals, antibacterials, and strong steroids can thin the skin and worsen fungal propagation. Always obtain a clinical assessment before initiating topical therapies.`
      }
    ];

    for (const a of demoArticles) {
      await prisma.article.upsert({
        where: { slug: a.slug },
        update: {
          title: a.title,
          excerpt: a.excerpt,
          category: a.category,
          author_id: a.author_id,
          status: a.status,
          views_count: a.views_count,
          reading_time_minutes: a.reading_time_minutes,
          published_at: a.published_at,
          cover_image_url: a.cover_image_url,
          content: a.content
        },
        create: {
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt,
          category: a.category,
          author_id: a.author_id,
          status: a.status,
          views_count: a.views_count,
          reading_time_minutes: a.reading_time_minutes,
          published_at: a.published_at,
          cover_image_url: a.cover_image_url,
          content: a.content
        }
      });
      console.log(`  article [${a.status}]: ${a.title}`);
    }
  }

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
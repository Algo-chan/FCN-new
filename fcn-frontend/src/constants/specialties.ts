export const MASTER_SPECIALTIES = [
  "General Medicine",
  "General Surgery",
  "Cardiology",
  "Pediatrics",
  "Dermatology",
  "Endocrinology",
  "Gynecology & Obstetrics",
  "Orthopedics",
  "Neurology",
  "Psychiatry & Mental Health",
  "ENT (Ear, Nose & Throat)",
  "Ophthalmology",
  "Dentistry",
  "Internal Medicine",
  "Emergency Medicine",
  "Radiology",
  "Physiotherapy",
  "Nutrition & Dietetics"
] as const;

export type Specialty = typeof MASTER_SPECIALTIES[number];

export interface SpecialtyCategory {
  id: string;
  name: string;
  description: string;
  iconName: "Stethoscope" | "Baby" | "HeartPulse" | "Activity" | "Brain";
  color: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
  specialties: string[];
}

export const SPECIALTY_CATEGORIES: SpecialtyCategory[] = [
  {
    id: "primary-care",
    name: "General & Primary Care",
    description: "Everyday health, acute illnesses, checkups & emergency triage",
    iconName: "Stethoscope",
    color: {
      bg: "bg-teal-500/10 dark:bg-teal-500/20",
      text: "text-teal-700 dark:text-teal-300",
      border: "border-teal-500/30",
      badge: "bg-teal-500 text-white"
    },
    specialties: [
      "General Medicine",
      "Internal Medicine",
      "Emergency Medicine",
      "Nutrition & Dietetics"
    ]
  },
  {
    id: "women-children",
    name: "Women & Child Health",
    description: "Pediatrics, prenatal care, obstetrics & gynecology",
    iconName: "Baby",
    color: {
      bg: "bg-rose-500/10 dark:bg-rose-500/20",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-500/30",
      badge: "bg-rose-500 text-white"
    },
    specialties: [
      "Pediatrics",
      "Gynecology & Obstetrics"
    ]
  },
  {
    id: "heart-chronic",
    name: "Heart & Chronic Illness",
    description: "Cardiology, diabetes, hormonal endocrine health & vital monitoring",
    iconName: "HeartPulse",
    color: {
      bg: "bg-amber-500/10 dark:bg-amber-500/20",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-500/30",
      badge: "bg-amber-500 text-white"
    },
    specialties: [
      "Cardiology",
      "Endocrinology"
    ]
  },
  {
    id: "surgery-rehab",
    name: "Surgery, Bones & Rehab",
    description: "Operative consultation, joints, fractures & physical therapy",
    iconName: "Activity",
    color: {
      bg: "bg-sky-500/10 dark:bg-sky-500/20",
      text: "text-sky-700 dark:text-sky-300",
      border: "border-sky-500/30",
      badge: "bg-sky-500 text-white"
    },
    specialties: [
      "General Surgery",
      "Orthopedics",
      "Physiotherapy"
    ]
  },
  {
    id: "sensory-mental",
    name: "Sensory, Skin & Mental Health",
    description: "Dermatology, vision, ENT, neurology, dentistry & psychiatric wellness",
    iconName: "Brain",
    color: {
      bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      text: "text-indigo-700 dark:text-indigo-300",
      border: "border-indigo-500/30",
      badge: "bg-indigo-500 text-white"
    },
    specialties: [
      "Dermatology",
      "Ophthalmology",
      "ENT (Ear, Nose & Throat)",
      "Dentistry",
      "Neurology",
      "Psychiatry & Mental Health",
      "Radiology"
    ]
  }
];

export function getGroupedSpecialties(availableSpecialties: string[]) {
  const categorized = SPECIALTY_CATEGORIES.map((cat) => {
    const matched = availableSpecialties.length > 0
      ? cat.specialties.filter((s) => availableSpecialties.some((avail) => avail.toLowerCase() === s.toLowerCase()))
      : cat.specialties;
    return {
      category: cat,
      items: matched
    };
  });

  const allKnown = SPECIALTY_CATEGORIES.flatMap((c) => c.specialties.map((s) => s.toLowerCase()));
  const uncategorized = availableSpecialties.filter((s) => !allKnown.includes(s.toLowerCase()));

  return { categorized, uncategorized };
}

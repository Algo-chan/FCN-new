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

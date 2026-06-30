export type Role = "patient" | "doctor" | "nurse" | "rural_health_officer" | "hospital_admin" | "super_admin";
export type UserStatus = "pending" | "active" | "suspended" | "rejected";
export type ThemePreference = "dark" | "light";
export type AppointmentType = "remote" | "in_person" | "nurse_visit";
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "scheduled"
  | "in_session"
  | "completed"
  | "cancelled";
export type VitalStatus = "normal" | "warning" | "critical";
export type OccupancyBand = "low" | "moderate" | "high";

export interface User {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  role: Role;
  status: UserStatus;
  theme_preference: ThemePreference;
  fcm_token?: string | null;
}

export interface PatientProfile {
  user_id: string;
  date_of_birth?: string | null;
  blood_type?: string | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  chronic_conditions: string[];
  known_allergies?: string | null;
  home_address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
}

export interface DoctorProfile {
  user_id: string;
  license_number: string;
  specialty: string;
  hospital_id?: string | null;
  availability_status: "available" | "in_session" | "unavailable";
  bio?: string | null;
  rating_average: number;
  rating_count: number;
  years_experience: number;
  consultation_fee_etb: number;
}

export interface Hospital {
  id: string;
  name: string;
  location: string;
  lat?: number | null;
  lng?: number | null;
  total_beds: number;
  occupied_beds: number;
  active_doctors_count: number;
  avg_wait_minutes: number;
  specialties: string[];
  status: "active" | "pending" | "inactive";
  data_feed_type: string;
  last_updated_at: string;
  occupancy_percent: number;
  occupancy_band: OccupancyBand;
}

export interface HospitalDetail extends Hospital {
  recommendation: string;
}

export interface HospitalAdminProfile {
  user_id: string;
  hospital_id: string;
  full_name: string;
  email: string | null;
  status: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  nurse_id?: string | null;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  scheduled_at: string;
  duration_minutes: number;
  chief_complaint?: string | null;
  platform_fee_etb: number;
  created_at?: string;
  updated_at?: string;
  doctor?: { id: string; full_name: string; doctor_profile?: { specialty?: string } };
  patient?: { id: string; full_name: string };
  nurse?: { id: string; full_name: string };
}

export interface PatientVital {
  id: string;
  patient_id: string;
  recorded_by_user_id: string;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  blood_glucose_mg_dl?: number | null;
  heart_rate_bpm?: number | null;
  temperature_celsius?: number | null;
  spo2_percent?: number | null;
  recorded_at: string;
}

export interface Prescription {
  id: string;
  rx_reference: string;
  patient_id: string;
  doctor_id: string;
  status: "active" | "refill_due" | "expired" | "cancelled";
  qr_hash: string;
  issued_at: string;
  expires_at: string;
  notes?: string | null;
  medications?: PrescriptionMedication[];
  doctor?: { id: string; full_name: string };
  patient?: { id: string; full_name: string };
}

export interface PrescriptionMedication {
  id: string;
  prescription_id: string;
  drug_name: string;
  strength: string;
  instructions: string;
  supply_days: number;
  is_ongoing: boolean;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  message_text: string;
  message_type: "text" | "file" | "system";
  sent_at: string;
  read_at?: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string | null;
  read: boolean;
  created_at: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ToastMessage {
  id: string;
  type: "success" | "warning" | "danger" | "info";
  title: string;
  message?: string;
}

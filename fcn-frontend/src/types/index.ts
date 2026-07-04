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
  photo_url?: string | null;
  photo_public_id?: string | null;
  available_since?: string | null;
  languages?: string[];
}

export interface DoctorWithProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  doctor_profile: {
    specialty: string;
    hospital_id?: string | null;
    hospital_name?: string | null;
    availability_status: string;
    bio?: string | null;
    rating_average: number;
    rating_count: number;
    years_experience: number;
    consultation_fee_etb: number;
    photo_url?: string | null;
  };
}

export interface ConsultationRating {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  rating: number;
  review_text?: string | null;
  created_at: string;
  patient?: { full_name: string };
}

export interface DoctorFullProfile extends DoctorWithProfile {
  recent_ratings: ConsultationRating[];
  total_consultations: number;
  estimated_response_time: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  label: string;
}

export type AvailabilityStatus = "available" | "in_session" | "unavailable";

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

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";

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
  payment_status: PaymentStatus;
  payment_tx_ref?: string | null;
  chapa_checkout_url?: string | null;
  reschedule_count: number;
  rescheduled_from?: string | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_by_role?: string | null;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  created_at?: string;
  updated_at?: string;
  doctor?: { id: string; full_name: string; doctor_profile?: { specialty?: string } };
  patient?: { id: string; full_name: string };
  nurse?: { id: string; full_name: string };
}

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
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
  appointment_id: string;
  sender_user_id: string;
  recipient_user_id: string;
  sender_name: string;
  message_text: string;
  message_type: "text" | "file" | "system";
  file_url?: string | null;
  file_type?: string | null;
  file_name?: string | null;
  file_size_bytes?: number | null;
  is_system_message?: boolean;
  sent_at: string;
  read_at?: string | null;
  error?: boolean;
}

export interface ConsultationContext {
  appointment: {
    id: string;
    patient_id: string;
    doctor_id: string;
    appointment_type: AppointmentType;
    status: AppointmentStatus;
    scheduled_at: string;
    chief_complaint?: string | null;
    consultation_started_at?: string | null;
    consultation_ended_at?: string | null;
    patient: {
      id: string;
      full_name: string;
    };
    doctor: {
      id: string;
      full_name: string;
      specialty?: string | null;
      photo_url?: string | null;
      bio?: string | null;
      rating_average?: number;
      years_experience?: number;
    };
  };
  consultationContext?: {
    patient: {
      id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
    };
    patientProfile: {
      date_of_birth: string | null;
      blood_type: string | null;
      weight_kg: number | null;
      height_cm: number | null;
      chronic_conditions: string[];
      known_allergies: string | null;
      home_address: string | null;
      emergency_contact_name: string | null;
      emergency_contact_phone: string | null;
    } | null;
    latestVitals: {
      bp_systolic: number | null;
      bp_diastolic: number | null;
      blood_glucose_mg_dl: number | null;
      heart_rate_bpm: number | null;
      temperature_celsius: number | null;
      spo2_percent: number | null;
      recorded_at: string | null;
    };
    activePrescriptions: Prescription[];
    appointmentHistory: {
      total: number;
      completed: number;
    };
  } | null;
  isReadOnly: boolean;
}

export interface ConsultationSummary {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  total_messages: number;
  prescription_issued: boolean;
  prescription_id?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  summary_note?: string | null;
  created_at: string;
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

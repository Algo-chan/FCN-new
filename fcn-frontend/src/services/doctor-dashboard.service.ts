import { api } from "./api";
import type { ApiResponse } from "@/types";

export interface DoctorStats {
  today_appointments: number;
  week_appointments: number;
  week_completed: number;
  total_consultations: number;
  total_patients: number;
  rating_average: number;
  rating_count: number;
  pending_requests: number;
  consultations_this_month: number;
  consultations_last_month: number;
  growth_percent: number;
  current_status: "available" | "in_session" | "unavailable";
  payment_status: "pilot" | "active";
  free_period_ends_at: string | null;
}

export interface ScheduleAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_type: string;
  status: string;
  scheduled_at: string;
  duration_minutes: number;
  chief_complaint: string | null;
  patient: { id: string; full_name: string; patient_profile?: { date_of_birth?: string | null } | null };
}

export interface DaySchedule {
  date: string;
  appointments: ScheduleAppointment[];
}

export interface WeekSchedule {
  week_start: string;
  days: DaySchedule[];
}

export interface ActivePatient {
  patient_id: string;
  full_name: string;
  photo_url: string | null;
  age: number | null;
  blood_type: string | null;
  chronic_conditions: string[];
  known_allergies: string | null;
  next_appointment: {
    id: string;
    scheduled_at: string;
    type: string;
    status: string;
  };
  vitals_summary: {
    bp_systolic: number | null;
    bp_diastolic: number | null;
    heart_rate_bpm: number | null;
    temperature_celsius: number | null;
    spo2_percent: number | null;
    blood_glucose_mg_dl: number | null;
  } | null;
}

export interface PreviousPatient {
  patient_id: string;
  full_name: string;
  age: number | null;
  last_consultation: string;
  last_appointment_type: string;
  total_consultations: number;
}

export interface EarningsSummary {
  total_completed: number;
  this_month_completed: number;
  last_month_completed: number;
  this_week_completed: number;
  average_per_week: number;
  growth_vs_last_month: number;
  monthly_trend: { month: string; consultations: number }[];
  payment_status: "pilot" | "active";
  pilot_message: string | null;
}

export interface DoctorNote {
  id: string;
  note_text: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  appointment_id: string | null;
}

export const getDoctorStats = () =>
  api.get<ApiResponse<DoctorStats>>("/doctor-dashboard/stats").then((r) => r.data);

export const getDoctorSchedule = (date: string, view: "day" | "week") =>
  api.get<ApiResponse<WeekSchedule | DaySchedule>>("/doctor-dashboard/schedule", { params: { date, view } }).then((r) => r.data);

export const getActivePatients = () =>
  api.get<ApiResponse<ActivePatient[]>>("/doctor-dashboard/active-patients").then((r) => r.data);

export const getPreviousPatients = (page?: number) =>
  api.get<ApiResponse<PreviousPatient[]>>("/doctor-dashboard/previous-patients", { params: { page, limit: 20 } }).then((r) => r.data);

export const getEarningsSummary = () =>
  api.get<ApiResponse<EarningsSummary>>("/doctor-dashboard/earnings-summary").then((r) => r.data);

export const issueFollowUpPrescription = (appointmentId: string, medications: any[]) =>
  api.post<ApiResponse<any>>("/doctor-dashboard/follow-up-prescription", { appointmentId, medications }).then((r) => r.data);

export const saveDoctorNote = (patientId: string, noteText: string, appointmentId?: string) =>
  api.post<ApiResponse<DoctorNote>>("/doctor-dashboard/doctor-note", { patientId, noteText, appointmentId }).then((r) => r.data);

export const getDoctorNotes = (patientId: string) =>
  api.get<ApiResponse<DoctorNote[]>>(`/doctor-dashboard/doctor-notes/${patientId}`).then((r) => r.data);

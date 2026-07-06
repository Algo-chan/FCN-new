import { api } from "./api";
import type { ApiResponse } from "@/types";

export interface NurseStats {
  today_visits: number;
  upcoming_visits: number;
  completed_this_week: number;
  completed_total: number;
  patients_served: number;
  avg_vitals_per_visit: number;
}

export interface TodayVisit {
  id: string;
  patient_id: string;
  patient_name: string;
  home_address: string | null;
  home_lat: number | null;
  home_lng: number | null;
  chronic_conditions: string[];
  known_allergies: string | null;
  scheduled_at: string;
  status: string;
  appointment_type: string;
  time_label: string;
}

export interface UpcomingVisit {
  id: string;
  patient_id: string;
  patient_name: string;
  home_address: string | null;
  scheduled_at: string;
  status: string;
  appointment_type: string;
}

export interface VisitPreparation {
  appointment: {
    id: string;
    scheduled_at: string;
    status: string;
    appointment_type: string;
    chief_complaint: string | null;
    duration_minutes: number;
  };
  patient: {
    id: string;
    full_name: string;
    phone: string | null;
    date_of_birth: string | null;
    age: number | null;
    blood_type: string | null;
    home_address: string | null;
    home_lat: number | null;
    home_lng: number | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    chronic_conditions: string[];
    known_allergies: string | null;
  };
  vitals_history: any[];
  latest_vitals: any;
  active_prescriptions: any[];
  previous_visits: any[];
  suggested_checklist: string[];
  doctor_instructions: string | null;
  existing_checklist: {
    id: string;
    items: string;
    completed_items: string;
    notes: string | null;
    completed_at: string | null;
  } | null;
}

export const getNurseStats = () =>
  api.get<ApiResponse<NurseStats>>("/nurse-dashboard/stats").then((r) => r.data);

export const getTodayVisits = () =>
  api.get<ApiResponse<TodayVisit[]>>("/nurse-dashboard/today-visits").then((r) => r.data);

export const getUpcomingVisits = () =>
  api.get<ApiResponse<UpcomingVisit[]>>("/nurse-dashboard/upcoming-visits").then((r) => r.data);

export const getVisitPreparation = (appointmentId: string) =>
  api.get<ApiResponse<VisitPreparation>>(`/nurse-dashboard/visit-preparation/${appointmentId}`).then((r) => r.data);

export const saveVisitChecklist = (appointmentId: string, items: string[]) =>
  api.post<ApiResponse<any>>(`/nurse-dashboard/visit-checklist/${appointmentId}`, { items }).then((r) => r.data);

export const updateVisitChecklist = (appointmentId: string, completedItems: string[], notes?: string) =>
  api.patch<ApiResponse<any>>(`/nurse-dashboard/visit-checklist/${appointmentId}`, { completedItems, notes }).then((r) => r.data);

export const getVisitHistory = () =>
  api.get<ApiResponse<any[]>>("/nurse-dashboard/visit-history").then((r) => r.data);

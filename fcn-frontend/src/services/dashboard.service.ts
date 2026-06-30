import { api } from "@/services/api";
import type { ApiResponse, Appointment, PatientVital, Prescription } from "@/types";

export interface PatientDashboardData {
  latestVitals: PatientVital | null;
  upcomingAppointments: Appointment[];
  activePrescriptions: Prescription[];
  unreadNotifications: number;
  healthScore: number;
}

export interface DoctorDashboardData {
  todayAppointmentsCount: number;
  totalPatients: number;
  pendingAppointments: number;
  unreadNotifications: number;
  upcomingAppointments: { id: string; scheduled_at: string; status: string; patient: { id: string; full_name: string } }[];
  recentPatients: { patient: { id: string; full_name: string }; updated_at: string }[];
}

export interface NurseDashboardData {
  assignedPatientsCount: number;
  todayVisitsCount: number;
  recentVitals: (PatientVital & { patient: { id: string; full_name: string } })[];
  unreadNotifications: number;
  upcomingVisits: { id: string; scheduled_at: string; status: string; patient: { id: string; full_name: string } }[];
}

export interface AdminDashboardData {
  totalUsers: number;
  usersByRole: { role: string; _count: { id: number } }[];
  pendingApprovals: number;
  activeHospitals: number;
  todayAppointments: number;
  unreadNotifications: number;
}

export const dashboardService = {
  getPatientDashboard: () =>
    api.get<ApiResponse<PatientDashboardData>>("/dashboard/patient").then((r) => r.data),

  getDoctorDashboard: () =>
    api.get<ApiResponse<DoctorDashboardData>>("/dashboard/doctor").then((r) => r.data),

  getNurseDashboard: () =>
    api.get<ApiResponse<NurseDashboardData>>("/dashboard/nurse").then((r) => r.data),

  getAdminDashboard: () =>
    api.get<ApiResponse<AdminDashboardData>>("/dashboard/admin").then((r) => r.data)
};

import { api } from "./api";
import type { ApiResponse } from "@/types";

export interface AnalyticsOverview {
  total_users: number;
  total_users_growth: number;
  total_doctors: number;
  total_patients: number;
  total_appointments: number;
  appointments_today: number;
  appointments_this_week: number;
  completed_consultations: number;
  completion_rate: number;
  pending_approvals: number;
  active_hospitals: number;
  active_pharmacies: number;
  total_prescriptions: number;
  revenue_this_month: number;
  revenue_total: number;
}

export interface TrendPoint {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

export interface RegistrationTrendPoint {
  week: string;
  patients: number;
  doctors: number;
  nurses: number;
  total: number;
}

export interface TopDoctor {
  doctor_id: string;
  full_name: string;
  specialty: string;
  hospital_name: string | null;
  photo_url: string | null;
  total_consultations: number;
  completed_consultations: number;
  rating_average: number;
  rating_count: number;
  revenue_generated: number;
}

export interface RevenueTrendPoint {
  month: string;
  revenue: number;
  consultations_paid: number;
  average_fee: number;
}

export interface UserFilters {
  role?: string;
  status?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface ActivityLogFilters {
  action?: string;
  actorId?: string;
  targetType?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  limit: number;
}

export interface ActivityLogEntry {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  details: any;
  ip_address: string | null;
  created_at: string;
  actor: {
    id: string;
    full_name: string;
    email: string | null;
    role: string;
  };
}

export const getAnalyticsOverview = () =>
  api.get<ApiResponse<AnalyticsOverview>>("/admin/analytics/overview").then((r) => r.data);

export const getConsultationsTrend = (days?: number) =>
  api.get<ApiResponse<TrendPoint[]>>("/admin/analytics/consultations", { params: { days } }).then((r) => r.data);

export const getRegistrationsTrend = (weeks?: number) =>
  api.get<ApiResponse<RegistrationTrendPoint[]>>("/admin/analytics/registrations", { params: { weeks } }).then((r) => r.data);

export const getTopDoctors = (limit?: number) =>
  api.get<ApiResponse<TopDoctor[]>>("/admin/analytics/top-doctors", { params: { limit } }).then((r) => r.data);

export const getRevenueTrend = (months?: number) =>
  api.get<ApiResponse<RevenueTrendPoint[]>>("/admin/analytics/revenue", { params: { months } }).then((r) => r.data);

export const getUsers = (filters: UserFilters) =>
  api.get<ApiResponse<any[]>>("/admin/users", { params: filters }).then((r) => r.data);

export const getUserReview = (userId: string) =>
  api.get<ApiResponse<any>>(`/admin/users/${userId}/review`).then((r) => r.data);

export const approveUser = (userId: string) =>
  api.patch<ApiResponse<any>>(`/admin/users/${userId}/approve`).then((r) => r.data);

export const rejectUser = (userId: string, reason: string) =>
  api.patch<ApiResponse<any>>(`/admin/users/${userId}/reject`, { reason }).then((r) => r.data);

export const suspendUser = (userId: string, reason: string) =>
  api.patch<ApiResponse<any>>(`/admin/users/${userId}/suspend`, { reason }).then((r) => r.data);

export const reactivateUser = (userId: string) =>
  api.patch<ApiResponse<any>>(`/admin/users/${userId}/reactivate`).then((r) => r.data);

export const getActivityLogs = (filters: ActivityLogFilters) =>
  api.get<ApiResponse<ActivityLogEntry[]>>("/admin/activity-logs", { params: filters }).then((r) => r.data);

export const getSettings = () =>
  api.get<ApiResponse<any[]>>("/admin/settings").then((r) => r.data);

export const updateSetting = (key: string, value: string) =>
  api.patch<ApiResponse<any>>(`/admin/settings/${key}`, { value }).then((r) => r.data);

export const manualCleanup = () =>
  api.post<ApiResponse<{ deleted_count: number }>>("/admin/cleanup/messages").then((r) => r.data);

export const clearAllNotifications = () =>
  api.post<ApiResponse<{ deleted_count: number }>>("/admin/cleanup/notifications").then((r) => r.data);

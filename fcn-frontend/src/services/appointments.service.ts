import { api } from "@/services/api";
import type { ApiResponse, Appointment } from "@/types";

export interface CreateAppointmentDto {
  doctor_id: string;
  appointment_type: "remote" | "in_person" | "nurse_visit";
  scheduled_at: string;
  duration_minutes?: number;
  chief_complaint?: string;
}

export interface GetAppointmentsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export const appointmentsService = {
  create: (data: CreateAppointmentDto) =>
    api.post<ApiResponse<Appointment>>("/appointments", data).then((r) => r.data),

  getMyAppointments: (params?: GetAppointmentsParams) =>
    api.get<ApiResponse<Appointment[]>>("/appointments", { params }).then((r) => r.data),

  getDoctorAppointments: (params?: GetAppointmentsParams) =>
    api.get<ApiResponse<Appointment[]>>("/appointments/doctor", { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Appointment>>(`/appointments/${id}`).then((r) => r.data),

  cancel: (id: string, reason?: string) =>
    api.patch<ApiResponse<void>>(`/appointments/${id}/cancel`, { reason }).then((r) => r.data),

  reschedule: (id: string, new_scheduled_at: string, reason?: string) =>
    api.patch<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, { new_scheduled_at, reason }).then((r) => r.data),

  start: (id: string) =>
    api.patch<ApiResponse<void>>(`/appointments/${id}/start`).then((r) => r.data),

  complete: (id: string) =>
    api.patch<ApiResponse<void>>(`/appointments/${id}/complete`).then((r) => r.data)
};

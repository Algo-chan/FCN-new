import { api } from "@/services/api";
import type { ApiResponse, PublicDoctorCard, PublicDoctorDetail, TimeSlot, AvailabilityStatus } from "@/types";

export interface GetDoctorsParams {
  specialty?: string;
  hospital_id?: string;
  city?: string;
  min_fee?: number;
  max_fee?: number;
  language?: string;
  available_today?: boolean;
  available_now?: boolean;
  verified_only?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpdateDoctorProfileDto {
  bio?: string;
  years_experience?: number;
  consultation_fee_etb?: number;
  specialty?: string;
}

export const doctorsService = {
  getAllDoctors: (params: GetDoctorsParams) =>
    api.get<ApiResponse<PublicDoctorCard[]>>("/doctors", { params }).then((r) => r.data),

  getAvailableSpecialties: () =>
    api.get<ApiResponse<string[]>>("/doctors/specialties").then((r) => r.data?.data ?? []),

  getAvailableCities: () =>
    api.get<ApiResponse<string[]>>("/doctors/cities").then((r) => r.data?.data ?? []),

  getDoctorById: (id: string) =>
    api.get<ApiResponse<PublicDoctorDetail>>(`/doctors/${id}`).then((r) => r.data),

  getDoctorAvailability: (id: string, date: string) =>
    api.get<ApiResponse<TimeSlot[]>>(`/doctors/${id}/availability`, { params: { date } }).then((r) => r.data),

  updateAvailabilityStatus: (status: AvailabilityStatus) =>
    api.patch<ApiResponse<void>>("/doctors/me/availability", { availability_status: status }).then((r) => r.data),

  updateDoctorProfile: (data: UpdateDoctorProfileDto) =>
    api.patch<ApiResponse<void>>("/doctors/me/profile", data).then((r) => r.data),

  uploadProfilePhoto: (file: File) => {
    const formData = new FormData();
    formData.append("photo", file);
    return api.post<ApiResponse<{ photo_url: string }>>("/doctors/me/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then((r) => r.data);
  },

  deleteProfilePhoto: () =>
    api.delete<ApiResponse<void>>("/doctors/me/photo").then((r) => r.data),

  getHospitalSpecialties: (hospitalId: string) =>
    api.get<ApiResponse<string[]>>(`/hospitals/${hospitalId}/specialties`).then((r) => r.data?.data ?? [])
};

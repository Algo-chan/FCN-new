import { api } from "@/services/api";
import type { ApiResponse, Hospital, HospitalAdminProfile, HospitalDetail } from "@/types";

export interface OccupancyUpdateDto {
  total_beds: number;
  occupied_beds: number;
  active_doctors_count: number;
  avg_wait_minutes: number;
}

export interface CreateHospitalDto {
  name: string;
  location: string;
  lat?: number;
  lng?: number;
  specialties: string[];
}

export interface CreateHospitalAdminDto {
  full_name: string;
  email: string;
  password: string;
  hospital_id: string;
}

export const hospitalsService = {
  getAllHospitals: (statusFilter?: string) => {
    const params = statusFilter ? { params: { status: statusFilter } } : {};
    return api.get<ApiResponse<Hospital[]>>("/hospitals", params).then((r) => r.data);
  },

  getHospitalById: (id: string) =>
    api.get<ApiResponse<HospitalDetail>>(`/hospitals/${id}`).then((r) => r.data),

  updateOccupancy: (id: string, data: OccupancyUpdateDto) =>
    api.patch<ApiResponse<Hospital>>(`/hospitals/${id}/occupancy`, data).then((r) => r.data),

  createHospital: (data: CreateHospitalDto) =>
    api.post<ApiResponse<Hospital>>("/hospitals", data).then((r) => r.data),

  updateHospital: (id: string, data: Partial<CreateHospitalDto>) =>
    api.patch<ApiResponse<Hospital>>(`/hospitals/${id}`, data).then((r) => r.data),

  updateHospitalStatus: (id: string, status: string) =>
    api.patch<ApiResponse<Hospital>>(`/hospitals/${id}/status`, { status }).then((r) => r.data),

  getHospitalAdmins: (hospitalId: string) =>
    api.get<ApiResponse<HospitalAdminProfile[]>>(`/hospitals/${hospitalId}/admins`).then((r) => r.data),

  createHospitalAdmin: (hospitalId: string, data: CreateHospitalAdminDto) =>
    api.post<ApiResponse<HospitalAdminProfile>>(`/hospitals/${hospitalId}/admins`, data).then((r) => r.data)
};

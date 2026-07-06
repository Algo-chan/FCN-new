import { api } from "@/services/api";
import type { ApiResponse, User, PatientProfile, DoctorProfile, NurseProfile, ConsultationRating } from "@/types";

export interface UpdateProfileDto {
  full_name?: string;
  email?: string;
  phone?: string;
}

export interface UpdatePatientProfileDto {
  date_of_birth?: string;
  blood_type?: string;
  weight_kg?: number;
  height_cm?: number;
  chronic_conditions?: string[];
  known_allergies?: string;
  home_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface UpdateDoctorProfileDto {
  bio?: string;
  years_experience?: number;
  consultation_fee_etb?: number;
  languages_spoken?: string[];
  clinic_address?: string;
  consultation_types?: ("remote" | "in_person" | "nurse_visit")[];
}

export interface UpdateDoctorVisibilityDto {
  show_phone?: boolean;
  show_email?: boolean;
  show_hospital?: boolean;
  show_rating?: boolean;
  show_experience?: boolean;
  show_consultation_count?: boolean;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface FullProfile {
  user: User;
  profile: PatientProfile | DoctorProfile | NurseProfile | null;
  hospital: { name: string; location: string } | null;
  recent_ratings: ConsultationRating[];
  onboarding_status: { completed: boolean; current_step: 1 | 2 | 3 } | null;
}

export interface DeletionInitiateResponse {
  email_hint: string;
}

export interface DeleteOTPResponse {
  deletion_token: string;
}

export interface DoctorPublicProfile {
  id: string;
  full_name: string;
  specialty: string;
  availability_status: string;
  bio: string | null;
  photo_url: string | null;
  email?: string;
  phone?: string;
  hospital_name?: string;
  hospital_location?: string;
  rating_average?: number;
  rating_count?: number;
  years_experience?: number;
  consultation_count?: number;
  languages_spoken: string[];
  consultation_types: string[];
  clinic_address?: string;
  recent_ratings?: ConsultationRating[];
}

export const profileService = {
  getMyProfile: () =>
    api.get<ApiResponse<FullProfile>>("/profile/me").then((r) => r.data),

  updateProfile: (data: UpdateProfileDto) =>
    api.patch<ApiResponse<User>>("/profile/me", data).then((r) => r.data),

  updatePatientProfile: (data: UpdatePatientProfileDto) =>
    api.patch<ApiResponse<PatientProfile>>("/profile/me/patient-profile", data).then((r) => r.data),

  updateDoctorProfile: (data: UpdateDoctorProfileDto) =>
    api.patch<ApiResponse<DoctorProfile>>("/profile/me/doctor-profile", data).then((r) => r.data),

  updateDoctorVisibility: (data: UpdateDoctorVisibilityDto) =>
    api.patch<ApiResponse<DoctorProfile>>("/profile/me/doctor-visibility", data).then((r) => r.data),

  changePassword: (data: ChangePasswordDto) =>
    api.post<ApiResponse<{ message: string }>>("/profile/security/change-password", data).then((r) => r.data),

  send2FAOTP: (purpose: string) =>
    api.post<ApiResponse<{ message: string }>>("/profile/security/send-2fa-otp", { purpose }).then((r) => r.data),

  enable2FA: (otp: string) =>
    api.post<ApiResponse<{ message: string }>>("/profile/security/enable-2fa", { otp }).then((r) => r.data),

  disable2FA: (otp: string) =>
    api.post<ApiResponse<{ message: string }>>("/profile/security/disable-2fa", { otp }).then((r) => r.data),

  initiateDelete: () =>
    api.post<ApiResponse<DeletionInitiateResponse>>("/profile/delete/initiate").then((r) => r.data),

  confirmDeleteOTP: (otp: string) =>
    api.post<ApiResponse<DeleteOTPResponse>>("/profile/delete/confirm-otp", { otp }).then((r) => r.data),

  finalDelete: (deletion_token: string, reason?: string) =>
    api.post<ApiResponse<{ message: string }>>("/profile/delete/final-confirm", { deletion_token, reason }).then((r) => r.data),

  getDoctorPublicProfile: (doctorId: string) =>
    api.get<ApiResponse<DoctorPublicProfile>>(`/profile/doctors/${doctorId}/public`).then((r) => r.data)
};

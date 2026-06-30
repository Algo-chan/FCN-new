import { api, postApi } from "./api";
import type { ApiResponse, AuthTokens, User } from "@/types";

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface RegisterResponse {
  user: User;
  accessToken?: string;
  requiresApproval?: boolean;
  message?: string;
}

export interface OnboardingStep1Data {
  date_of_birth?: string;
  blood_type?: string;
  weight_kg?: number;
  height_cm?: number;
}

export interface OnboardingStep2Data {
  chronic_conditions: string[];
  known_allergies?: string;
}

export interface OnboardingStep3Data {
  home_address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

export interface OnboardingStatus {
  completed: boolean;
  current_step: 1 | 2 | 3;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", { email, password }),

  register: (data: Record<string, unknown>) =>
    api.post<ApiResponse<RegisterResponse>>("/auth/register", data),

  logout: () => postApi("/auth/logout"),

  refreshToken: () => api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
    "/auth/refresh",
    {},
    { withCredentials: true }
  ),

  sendOTP: (email: string) =>
    api.post<ApiResponse<{ message: string }>>("/auth/send-otp", { email }),

  verifyOTP: (email: string, otp: string) =>
    api.post<ApiResponse<{ verified: boolean }>>("/auth/verify-otp", { email, otp }),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{ message: string }>>("/auth/forgot-password", { email }),

  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post<ApiResponse<{ message: string }>>("/auth/reset-password", { email, otp, new_password: newPassword }),

  getMe: () => api.get<ApiResponse<User>>("/auth/me"),

  saveOnboardingStep1: (data: OnboardingStep1Data) =>
    api.post<ApiResponse<{ saved: boolean }>>("/onboarding/patient/step1", data),

  saveOnboardingStep2: (data: OnboardingStep2Data) =>
    api.post<ApiResponse<{ saved: boolean }>>("/onboarding/patient/step2", data),

  saveOnboardingStep3: (data: OnboardingStep3Data) =>
    api.post<ApiResponse<{ completed: boolean }>>("/onboarding/patient/step3", data),

  getOnboardingStatus: () =>
    api.get<ApiResponse<OnboardingStatus>>("/onboarding/patient/status")
};
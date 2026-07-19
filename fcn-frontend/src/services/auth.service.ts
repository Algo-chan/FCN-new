import axios from "axios";
import { api, postApi } from "./api";
import type { ApiResponse, AuthTokens, User } from "@/types";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export interface LoginResponse {
  user: User;
  accessToken: string;
}

export interface LoginOTPResponse {
  requiresOTP: boolean;
  email: string;
}

export interface RegisterStep1Response {
  message: string;
}

export interface VerifyRegistrationOTPResponse {
  verified: boolean;
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
    api.post<ApiResponse<LoginOTPResponse | LoginResponse>>("/auth/login", { email, password }),

  loginVerifyOTP: (email: string, otp: string) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login/verify-otp", { email, otp }),

  register: (data: Record<string, unknown>) =>
    api.post<ApiResponse<RegisterResponse>>("/auth/register", data),

  registerStep1: (data: { full_name: string; email: string; password: string }) =>
    api.post<ApiResponse<RegisterStep1Response>>("/auth/register/step1", data),

  verifyRegistrationOTP: (email: string, otp: string) =>
    api.post<ApiResponse<VerifyRegistrationOTPResponse>>("/auth/register/verify-otp", { email, otp }),

  registerStep2: (data: Record<string, unknown>) =>
    api.post<ApiResponse<RegisterResponse>>("/auth/register/step2", data),

  registerGoogle: (data: Record<string, unknown>) =>
    api.post<ApiResponse<RegisterResponse>>("/auth/register-google", data),

  logout: () => postApi("/auth/logout"),

  refreshToken: () => axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
    `${baseURL}/auth/refresh`,
    {},
    { withCredentials: true }
  ),

  sendOTP: (email: string) =>
    api.post<ApiResponse<{ message: string }>>("/auth/send-otp", { email }),

  verifyOTP: (email: string, otp: string) =>
    api.post<ApiResponse<{ verified: boolean }>>("/auth/verify-otp", { email, otp }),

  resendOTP: (email: string, purpose: "registration" | "login") =>
    api.post<ApiResponse<{ message: string }>>("/auth/resend-otp", { email, purpose }),

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
    api.get<ApiResponse<OnboardingStatus>>("/onboarding/patient/status"),

  skipOnboarding: () =>
    postApi<{ completed: boolean }>("/onboarding/patient/skip")
};
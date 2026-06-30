import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";
import type { ApiResponse, AuthTokens, User } from "@/types";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean } | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (data.success && data.data) {
          useAuthStore.getState().setTokens({
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken
          });
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${data.data.accessToken}`
          };
          return api(originalRequest);
        }
      } catch {
        useAuthStore.getState().logout();
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export const getApi = async <T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
  const response = await api.get<ApiResponse<T>>(url, config);
  return response.data;
};

export const postApi = async <T, P = unknown>(url: string, payload?: P): Promise<ApiResponse<T>> => {
  const response = await api.post<ApiResponse<T>>(url, payload);
  return response.data;
};

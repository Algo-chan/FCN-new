import { api } from "./api";
import type { ApiResponse } from "@/types";

export interface RecordVitalsDto {
  bp_systolic?: number;
  bp_diastolic?: number;
  blood_glucose_mg_dl?: number;
  heart_rate_bpm?: number;
  temperature_celsius?: number;
  spo2_percent?: number;
  weight_kg?: number;
  height_cm?: number;
  notes?: string;
}

export interface VitalsFilters {
  page?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
  vital_type?: string;
}

export const healthRecordsService = {
  recordVitals: (data: RecordVitalsDto) =>
    api.post<ApiResponse<unknown>>("/health-records/vitals", data).then((r) => r.data),

  getVitalsHistory: (patientId: string, filters?: VitalsFilters) =>
    api.get<ApiResponse<unknown[]>>(`/health-records/vitals/${patientId}`, { params: filters }).then((r) => r.data),

  getLatestVitals: (patientId: string) =>
    api.get<ApiResponse<unknown>>(`/health-records/vitals/${patientId}/latest`).then((r) => r.data),

  getVitalsTrends: (patientId: string) =>
    api.get<ApiResponse<unknown>>(`/health-records/vitals/${patientId}/trends`).then((r) => r.data),

  exportVitalsPDFData: (patientId: string) =>
    api.get<ApiResponse<unknown>>(`/health-records/vitals/${patientId}/export`).then((r) => r.data),

  getNursePatients: () =>
    api.get<ApiResponse<unknown[]>>("/health-records/nurse/my-patients").then((r) => r.data)
};

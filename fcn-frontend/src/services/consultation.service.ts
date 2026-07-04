import { api } from "./api";
import type { ApiResponse, ConsultationContext, ConsultationSummary } from "@/types";
import type { Message } from "@/types";

export interface IssuePrescriptionDto {
  medications: {
    drug_name: string;
    strength: string;
    form?: string;
    instructions: string;
    frequency_per_day: number;
    reminder_times?: string[];
    supply_days: number;
    is_ongoing?: boolean;
    quantity?: number;
  }[];
  notes?: string;
}

export const consultationService = {
  getMessages: async (appointmentId: string, page = 1) => {
    const response = await api.get<ApiResponse<Message[]>>(
      `/consultations/${appointmentId}/messages?page=${page}&limit=50`
    );
    return response.data;
  },

  getConsultationContext: async (appointmentId: string) => {
    const response = await api.get<ApiResponse<ConsultationContext>>(
      `/consultations/${appointmentId}/context`
    );
    return response.data;
  },

  issuePrescription: async (appointmentId: string, data: IssuePrescriptionDto) => {
    const response = await api.post<ApiResponse<unknown>>(
      `/consultations/${appointmentId}/prescribe`,
      data
    );
    return response.data;
  },

  saveSummaryNote: async (appointmentId: string, note: string) => {
    const response = await api.post<ApiResponse<{ saved: boolean }>>(
      `/consultations/${appointmentId}/summary-note`,
      { note }
    );
    return response.data;
  },

  getConsultationSummary: async (appointmentId: string) => {
    const response = await api.get<ApiResponse<ConsultationSummary | null>>(
      `/consultations/${appointmentId}/summary`
    );
    return response.data;
  }
};

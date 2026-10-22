import { api } from "./api";
import type { ApiResponse } from "@/types";

export interface MatchedDoctor {
  id: string;
  full_name: string;
  doctor_profile?: {
    specialty: string;
    rating_average: number;
    rating_count?: number;
    photo_url?: string | null;
    years_experience?: number;
    city?: string | null;
  } | null;
}

export interface InstantConsultRequestResponse {
  available: boolean;
  appointmentId?: string;
  doctor?: MatchedDoctor;
  estimatedWait?: number;
  queuePosition?: number;
  nextAvailable?: MatchedDoctor[];
}

export const instantConsultService = {
  async requestInstantConsult(data: { chief_complaint?: string; allergies?: string } = {}) {
    const res = await api.post<ApiResponse<InstantConsultRequestResponse>>("/instant-consult/request", data);
    return res.data;
  },

  async acceptInstantConsult(appointmentId: string) {
    const res = await api.post<ApiResponse<{ success: boolean; appointmentId: string }>>("/instant-consult/accept", {
      appointment_id: appointmentId
    });
    return res.data;
  },

  async declineInstantConsult(appointmentId: string) {
    const res = await api.post<ApiResponse<{ success: boolean }>>("/instant-consult/decline", {
      appointment_id: appointmentId
    });
    return res.data;
  },

  async cancelInstantConsult(appointmentId?: string) {
    const res = await api.post<ApiResponse<{ success: boolean }>>("/instant-consult/cancel", {
      appointment_id: appointmentId
    });
    return res.data;
  },

  async getQueueStatus() {
    const res = await api.get<ApiResponse<{ inQueue: boolean; queuePosition: number; estimatedWait: number }>>(
      "/instant-consult/queue-status"
    );
    return res.data;
  }
};

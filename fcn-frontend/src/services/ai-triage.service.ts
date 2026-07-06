import { postApi, getApi, api } from "./api";
import type {
  ConversationMessage,
  ParsedAssessment,
  SymptomAssessment,
  ApiResponse
} from "@/types";

export interface StartAssessmentResponse {
  assessmentId: string;
  aiResponse: string;
  round: number;
}

export interface ContinueConversationResponse {
  aiResponse: string;
  round: number;
  isComplete: boolean;
  finalAssessment?: ParsedAssessment;
}

export interface AssessmentHistoryResponse {
  data: Array<{
    id: string;
    created_at: string;
    initial_symptoms: string;
    risk_level: string | null;
    is_complete: boolean;
    recommended_specialty: string | null;
    language: string;
    round_count: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const startAssessment = async (
  language: string,
  initialSymptoms: string
): Promise<ApiResponse<StartAssessmentResponse>> => {
  return postApi<StartAssessmentResponse>("/ai-triage/start", {
    language,
    initial_symptoms: initialSymptoms
  });
};

export const continueConversation = async (
  assessmentId: string,
  patientMessage: string
): Promise<ApiResponse<ContinueConversationResponse>> => {
  return postApi<ContinueConversationResponse>("/ai-triage/respond", {
    assessment_id: assessmentId,
    patient_message: patientMessage
  });
};

export const completeAssessment = async (
  assessmentId: string
): Promise<ApiResponse<ContinueConversationResponse>> => {
  return postApi<ContinueConversationResponse>("/ai-triage/complete", {
    assessment_id: assessmentId
  });
};

export const getAssessmentHistory = async (
  page: number = 1
): Promise<ApiResponse<AssessmentHistoryResponse>> => {
  return getApi<AssessmentHistoryResponse>(`/ai-triage/history?page=${page}&limit=10`);
};

export const getAssessmentById = async (
  id: string
): Promise<ApiResponse<SymptomAssessment>> => {
  return getApi<SymptomAssessment>(`/ai-triage/history/${id}`);
};

export const markBookingInitiated = async (
  id: string
): Promise<ApiResponse<{ booking_initiated: boolean }>> => {
  const response = await api.patch<ApiResponse<{ booking_initiated: boolean }>>(`/ai-triage/booking/${id}`);
  return response.data;
};

import { z } from "zod";

export const StartAssessmentSchema = z.object({
  language: z.enum(["en", "am", "so", "om"]),
  initial_symptoms: z.string().min(10, "Please describe your symptoms in at least 10 characters").max(1000, "Symptom description must be under 1000 characters")
});

export const ContinueConversationSchema = z.object({
  assessment_id: z.string().uuid("Invalid assessment ID"),
  patient_message: z.string().min(1, "Message is required").max(1000, "Message must be under 1000 characters")
});

export const CompleteAssessmentSchema = z.object({
  assessment_id: z.string().uuid("Invalid assessment ID")
});

export const HistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10)
});

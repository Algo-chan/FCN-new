import { z } from "zod";

export const RecordVitalsSchema = z
  .object({
    patient_id: z.string().uuid().optional(),
    bp_systolic: z.coerce.number().int().min(40).max(300).optional(),
    bp_diastolic: z.coerce.number().int().min(20).max(200).optional(),
    blood_glucose_mg_dl: z.coerce.number().min(20).max(600).optional(),
    heart_rate_bpm: z.coerce.number().int().min(20).max(300).optional(),
    temperature_celsius: z.coerce.number().min(30).max(45).optional(),
    spo2_percent: z.coerce.number().min(50).max(100).optional(),
    weight_kg: z.coerce.number().min(1).max(500).optional(),
    height_cm: z.coerce.number().min(30).max(250).optional(),
    notes: z.string().max(500).optional(),
    appointment_id: z.string().uuid().optional()
  })
  .superRefine((data, ctx) => {
    const hasAny =
      data.bp_systolic !== undefined ||
      data.bp_diastolic !== undefined ||
      data.blood_glucose_mg_dl !== undefined ||
      data.heart_rate_bpm !== undefined ||
      data.temperature_celsius !== undefined ||
      data.spo2_percent !== undefined ||
      data.weight_kg !== undefined ||
      data.height_cm !== undefined;
    if (!hasAny) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one vital field must be provided"
      });
    }
  });

export const GetVitalsHistorySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  vital_type: z.enum(["bp", "glucose", "heart_rate", "temperature", "spo2", "weight"]).optional()
});

export type RecordVitalsDto = z.infer<typeof RecordVitalsSchema>;
export type GetVitalsHistoryDto = z.infer<typeof GetVitalsHistorySchema>;

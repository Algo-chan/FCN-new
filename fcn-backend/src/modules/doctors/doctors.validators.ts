import { z } from "zod";
import { MASTER_SPECIALTIES } from "../../constants/specialties";

const booleanParam = z.enum(["true", "false"]).transform((val) => val === "true");

export const GetDoctorsQuerySchema = z.object({
  specialty: z.string().max(100).optional(),
  hospital_id: z.string().uuid({ message: "hospital_id must be a valid UUID" }).optional(),
  city: z.string().max(100).optional(),
  min_fee: z.coerce.number().min(0).optional(),
  max_fee: z.coerce.number().min(0).optional(),
  language: z.string().max(50).optional(),
  available_today: booleanParam.optional(),
  available_now: booleanParam.optional(),
  verified_only: booleanParam.optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

export const UpdateAvailabilityStatusSchema = z.object({
  availability_status: z.enum(["available", "in_session", "unavailable"])
});

export const UpdateDoctorProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  years_experience: z.coerce.number().int().min(0).max(60).optional(),
  consultation_fee_etb: z.coerce.number().min(0).optional(),
  follow_up_fee_etb: z.coerce.number().min(0).nullable().optional(),
  city: z.string().max(120).optional(),
  languages_spoken: z.array(z.string().max(40)).max(10).optional(),
  specialty: z.enum(MASTER_SPECIALTIES as unknown as [string, ...string[]]).optional()
});

export type GetDoctorsQueryDto = z.infer<typeof GetDoctorsQuerySchema>;
export type UpdateAvailabilityStatusDto = z.infer<typeof UpdateAvailabilityStatusSchema>;
export type UpdateDoctorProfileDto = z.infer<typeof UpdateDoctorProfileSchema>;
import { z } from "zod";
import { MASTER_SPECIALTIES } from "../../constants/specialties";

export const GetDoctorsQuerySchema = z.object({
  specialty: z.enum(MASTER_SPECIALTIES as unknown as [string, ...string[]]).optional(),
  hospital_id: z.string().uuid().optional(),
  available_now: z.enum(["true", "false"]).transform((val) => val === "true").optional(),
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
  specialty: z.enum(MASTER_SPECIALTIES as unknown as [string, ...string[]]).optional()
});

export type GetDoctorsQueryDto = z.infer<typeof GetDoctorsQuerySchema>;
export type UpdateAvailabilityStatusDto = z.infer<typeof UpdateAvailabilityStatusSchema>;
export type UpdateDoctorProfileDto = z.infer<typeof UpdateDoctorProfileSchema>;

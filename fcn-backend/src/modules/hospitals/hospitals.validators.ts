import { z } from "zod";
import { MASTER_SPECIALTIES } from "../../constants/specialties";

export const UpdateOccupancySchema = z
  .object({
    total_beds: z.coerce.number().int().min(1),
    occupied_beds: z.coerce.number().int().min(0),
    active_doctors_count: z.coerce.number().int().min(0),
    avg_wait_minutes: z.coerce.number().int().min(0)
  })
  .refine((data) => data.occupied_beds <= data.total_beds, {
    message: "Occupied beds cannot exceed total beds",
    path: ["occupied_beds"]
  });

export const CreateHospitalSchema = z.object({
  name: z.string().trim().min(3),
  location: z.string().trim().min(3),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  specialties: z.array(z.enum(MASTER_SPECIALTIES as unknown as [string, ...string[]])).min(1, "Select at least one specialty")
});

export const UpdateHospitalStatusSchema = z.object({
  status: z.enum(["active", "pending", "inactive"])
});

export const CreateHospitalAdminSchema = z.object({
  full_name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/\d/, "Password must contain at least one number"),
  hospital_id: z.string().uuid()
});

export type UpdateOccupancyDto = z.infer<typeof UpdateOccupancySchema>;
export type CreateHospitalDto = z.infer<typeof CreateHospitalSchema>;
export type UpdateHospitalStatusDto = z.infer<typeof UpdateHospitalStatusSchema>;
export type CreateHospitalAdminDto = z.infer<typeof CreateHospitalAdminSchema>;

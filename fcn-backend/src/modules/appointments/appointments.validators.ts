import { z } from "zod";

export const CreateAppointmentSchema = z.object({
  body: z.object({
    doctor_id: z.string().uuid(),
    appointment_type: z.enum(["remote", "in_person", "nurse_visit"]),
    scheduled_at: z.string().datetime({ message: "scheduled_at must be an ISO datetime string" }),
    duration_minutes: z.number().int().min(15).max(120).default(30),
    chief_complaint: z.string().max(500).optional()
  })
});

export const CancelAppointmentSchema = z.object({
  body: z.object({
    reason: z.string().max(500).optional()
  })
});

export const RescheduleAppointmentSchema = z.object({
  body: z.object({
    new_scheduled_at: z.string().datetime({ message: "new_scheduled_at must be an ISO datetime string" }),
    reason: z.string().max(500).optional()
  })
});

export const GetAppointmentsQuerySchema = z.object({
  query: z.object({
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12)
  })
});

export type CreateAppointmentDto = z.infer<typeof CreateAppointmentSchema>["body"];
export type CancelAppointmentDto = z.infer<typeof CancelAppointmentSchema>["body"];
export type RescheduleAppointmentDto = z.infer<typeof RescheduleAppointmentSchema>["body"];

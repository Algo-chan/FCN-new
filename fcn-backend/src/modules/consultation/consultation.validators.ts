import { z } from "zod";

export const IssuePrescriptionSchema = z.object({
  medications: z
    .array(
      z.object({
        drug_name: z.string().min(2).max(200),
        strength: z.string().min(1).max(50),
        form: z.string().optional(),
        instructions: z.string().min(5).max(500),
        frequency_per_day: z.number().int().min(1).max(6),
        reminder_times: z.array(z.string()).optional(),
        supply_days: z.number().int().min(1).max(365),
        is_ongoing: z.boolean().default(false),
        quantity: z.number().int().optional()
      })
    )
    .min(1, "At least one medication is required"),
  notes: z.string().max(500).optional()
});

export const SaveSummaryNoteSchema = z.object({
  note: z.string().min(1).max(2000)
});

export type IssuePrescriptionDto = z.infer<typeof IssuePrescriptionSchema>;
export type SaveSummaryNoteDto = z.infer<typeof SaveSummaryNoteSchema>;

import { z } from "zod";

const phoneRegex = /^(\+251|0)?[79]\d{8}$/;

export const UpdateProfileSchema = z.object({
  full_name: z.string().trim().min(2).max(100).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().regex(phoneRegex, "Invalid Ethiopian phone number (+251 format)").optional()
});

export const UpdatePatientProfileSchema = z.object({
  date_of_birth: z.coerce.date().optional(),
  blood_type: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional(),
  weight_kg: z.coerce.number().min(1).max(500).optional(),
  height_cm: z.coerce.number().min(30).max(250).optional(),
  chronic_conditions: z.array(z.string().trim()).optional(),
  known_allergies: z.string().optional(),
  home_address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional()
});

export const UpdateDoctorProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  years_experience: z.coerce.number().int().min(0).max(60).optional(),
  consultation_fee_etb: z.coerce.number().min(0).optional(),
  languages_spoken: z.array(z.enum(["Amharic", "English", "Somali", "Oromo", "Tigrinya", "Arabic"])).optional(),
  clinic_address: z.string().optional(),
  consultation_types: z.array(z.enum(["remote", "in_person", "nurse_visit"])).optional()
});

export const UpdateDoctorVisibilitySchema = z.object({
  show_phone: z.boolean().optional(),
  show_email: z.boolean().optional(),
  show_hospital: z.boolean().optional(),
  show_rating: z.boolean().optional(),
  show_experience: z.boolean().optional(),
  show_consultation_count: z.boolean().optional()
});

export const ChangePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirm_password: z.string()
  })
  .superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "Passwords do not match"
      });
    }
    if (data.new_password === data.current_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_password"],
        message: "New password must be different from current password"
      });
    }
  });

export const Send2FAOTPSchema = z.object({
  purpose: z.enum(["enable_2fa", "disable_2fa", "delete_account"])
});

export const VerifyOTPSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
});

export const InitiateDeleteSchema = z.object({});

export const FinalDeleteSchema = z.object({
  deletion_token: z.string().min(1),
  reason: z.string().optional()
});

export const ConfirmDeleteOTPSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits")
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type UpdatePatientProfileDto = z.infer<typeof UpdatePatientProfileSchema>;
export type UpdateDoctorProfileDto = z.infer<typeof UpdateDoctorProfileSchema>;
export type UpdateDoctorVisibilityDto = z.infer<typeof UpdateDoctorVisibilitySchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
export type Send2FAOTPDto = z.infer<typeof Send2FAOTPSchema>;
export type VerifyOTPDto = z.infer<typeof VerifyOTPSchema>;
export type FinalDeleteDto = z.infer<typeof FinalDeleteSchema>;

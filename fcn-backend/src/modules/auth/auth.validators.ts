import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number");

export const RegisterSchema = z
  .object({
    full_name: z.string().trim().min(2).max(100),
    email: z.string().trim().email(),
    password: passwordSchema,
    role: z.enum(["patient", "doctor", "nurse", "rural_health_officer"]),
    license_number: z.string().trim().optional(),
    specialty: z.string().trim().optional(),
    hospital_name: z.string().trim().optional(),
    years_experience: z.coerce.number().int().min(0).optional(),
    nursing_license_number: z.string().trim().optional(),
    coverage_zone: z.string().trim().optional()
  })
  .superRefine((data, ctx) => {
    if (data.role === "doctor") {
      if (!data.license_number) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["license_number"], message: "License number is required" });
      }
      if (!data.specialty) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["specialty"], message: "Specialty is required" });
      }
    }

    if (data.role === "nurse" || data.role === "rural_health_officer") {
      if (!data.nursing_license_number) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nursing_license_number"], message: "Nursing license number is required" });
      }
      if (!data.coverage_zone) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coverage_zone"], message: "Coverage zone is required" });
      }
    }
  });

export const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const SendOTPSchema = z.object({
  email: z.string().trim().email()
});

export const VerifyOTPSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().length(6)
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email()
});

export const ResetPasswordSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().length(6),
  new_password: passwordSchema
});

export const OnboardingStep1Schema = z.object({
  date_of_birth: z.coerce.date().optional(),
  blood_type: z.string().trim().optional(),
  weight_kg: z.coerce.number().positive().optional(),
  height_cm: z.coerce.number().positive().optional()
});

export const OnboardingStep2Schema = z.object({
  chronic_conditions: z.array(z.string().trim()).default([]),
  known_allergies: z.string().trim().optional().default("")
});

export const OnboardingStep3Schema = z.object({
  home_address: z.string().trim().min(1),
  emergency_contact_name: z.string().trim().min(1),
  emergency_contact_phone: z.string().trim().min(1)
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

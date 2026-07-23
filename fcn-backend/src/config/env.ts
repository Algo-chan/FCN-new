import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const requiredText = (name: string) =>
  z.string().trim().min(1, `${name} is required`);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: requiredText("DATABASE_URL").url("DATABASE_URL must be a valid URL"),
  JWT_SECRET: requiredText("JWT_SECRET").min(64, "JWT_SECRET must be at least 64 characters"),
  JWT_REFRESH_SECRET: requiredText("JWT_REFRESH_SECRET").min(64, "JWT_REFRESH_SECRET must be at least 64 characters"),
  JWT_EXPIRES_IN: requiredText("JWT_EXPIRES_IN"),
  JWT_REFRESH_EXPIRES_IN: requiredText("JWT_REFRESH_EXPIRES_IN"),
  REDIS_URL: requiredText("REDIS_URL"),
  UPSTASH_REDIS_REST_URL: z.string().optional().default(""),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),
  TWILIO_ACCOUNT_SID: z.string().optional().default(""),
  TWILIO_AUTH_TOKEN: z.string().optional().default(""),
  TWILIO_PHONE_NUMBER: z.string().optional().default(""),
  FIREBASE_PROJECT_ID: z.string().optional().default(""),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional().or(z.literal("")).default(""),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  GEMINI_API_KEY: z.string().optional().default(""),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/, "ENCRYPTION_KEY must be a 32-byte hex string"),
  FRONTEND_URL: requiredText("FRONTEND_URL").url("FRONTEND_URL must be a valid URL"),
  CORS_ORIGINS: requiredText("CORS_ORIGINS"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALLBACK_URL: z.string().url().optional().or(z.literal("")).default(""),
  SESSION_SECRET: requiredText("SESSION_SECRET").min(32, "SESSION_SECRET must be at least 32 characters"),
  CHAPA_SECRET_KEY: z.string().optional().default(""),
  CHAPA_WEBHOOK_SECRET: z.string().optional().default(""),
  BACKEND_URL: requiredText("BACKEND_URL").url("BACKEND_URL must be a valid URL")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Environment validation failed: ${details}`);
}

export const env = parsed.data;
export const corsOrigins = env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);

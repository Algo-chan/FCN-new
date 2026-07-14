import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { redis, redisSet } from "../../config/redis";
import { env } from "../../config/env";
import { hashPassword, comparePassword } from "../../utils/bcrypt";
import { AppError } from "../../utils/app-error";
import { emailService } from "../auth/email.service";
import type {
  UpdateProfileDto,
  UpdatePatientProfileDto,
  UpdateDoctorProfileDto,
  UpdateDoctorVisibilityDto
} from "./profile.validators";

const OTP_COST = 8;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const ACCEPTED_LANGUAGES = ["Amharic", "English", "Somali", "Oromo", "Tigrinya", "Arabic"] as const;
const ACCEPTED_CONSULTATION_TYPES = ["remote", "in_person", "nurse_visit"] as const;

type SafeUser = Omit<Awaited<ReturnType<typeof prisma.user.findUnique>> extends infer T ? T extends null ? never : T : never, "password_hash">;

export class ProfileService {
  async getMyProfile(userId: string, role: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient_profile: true,
        doctor_profile: { include: { hospital: { select: { name: true, location: true } } } },
        nurse_profile: true,
        hospital_admin_profiles: true,
        pharmacy_admin_profiles: true
      }
    });
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    const { password_hash: _pw, ...safeUser } = user;

    let profile = null;
    let hospital = null;
    let recentRatings: Array<Record<string, unknown>> = [];
    let onboardingStatus = null;

    if (role === "patient" && user.patient_profile) {
      profile = user.patient_profile;
      const pp = user.patient_profile;
      const completed = pp.onboarding_completed;
      let currentStep = 1;
      if (pp.date_of_birth && pp.blood_type && pp.weight_kg) currentStep = 2;
      if (pp.chronic_conditions.length > 0 || pp.known_allergies) currentStep = 3;
      onboardingStatus = { completed, current_step: Math.min(currentStep, 3) as 1 | 2 | 3 };
    }

    if (role === "doctor" && user.doctor_profile) {
      profile = user.doctor_profile;
      hospital = user.doctor_profile.hospital
        ? { name: user.doctor_profile.hospital.name, location: user.doctor_profile.hospital.location }
        : null;

      recentRatings = await prisma.consultationRating.findMany({
        where: { doctor_id: userId },
        orderBy: { created_at: "desc" },
        take: 3,
        include: { patient: { select: { full_name: true } } }
      });
    }

    if (role === "nurse" && user.nurse_profile) {
      profile = user.nurse_profile;
    }

    if (role === "hospital_admin" && user.hospital_admin_profiles?.[0]) {
      const hap = user.hospital_admin_profiles[0];
      profile = hap;
      const hosp = await prisma.hospital.findUnique({
        where: { id: hap.hospital_id },
        select: { name: true, location: true }
      });
      hospital = hosp ?? null;
    }

    if (role === "pharmacy_admin" && user.pharmacy_admin_profiles?.[0]) {
      profile = user.pharmacy_admin_profiles[0];
    }

    return {
      user: safeUser,
      profile,
      hospital,
      recent_ratings: recentRatings,
      onboarding_status: onboardingStatus
    };
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const updateData: Prisma.UserUpdateInput = {};
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    if (data.full_name !== undefined) updateData.full_name = data.full_name;

    if (data.email !== undefined && data.email !== user.email) {
      updateData.pending_email = data.email;
      updateData.email_verified = false;
      await emailService.sendOTPEmail(data.email, this.generateOTP(), "verification");
    }

    if (data.phone !== undefined && data.phone !== user.phone) {
      updateData.pending_phone = data.phone;
      updateData.phone_verified = false;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({ where: { id: userId }, data: updateData });
    }

    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, full_name: true, email: true, phone: true, role: true, status: true, theme_preference: true, email_verified: true, phone_verified: true, pending_email: true, pending_phone: true, created_at: true, last_login_at: true }
    });
  }

  async updatePatientProfile(userId: string, data: UpdatePatientProfileDto) {
    const updateData: Prisma.PatientProfileUpdateInput = {};
    if (data.date_of_birth !== undefined) updateData.date_of_birth = data.date_of_birth;
    if (data.blood_type !== undefined) updateData.blood_type = data.blood_type;
    if (data.weight_kg !== undefined) updateData.weight_kg = data.weight_kg;
    if (data.height_cm !== undefined) updateData.height_cm = data.height_cm;
    if (data.chronic_conditions !== undefined) updateData.chronic_conditions = data.chronic_conditions;
    if (data.known_allergies !== undefined) updateData.known_allergies = data.known_allergies;
    if (data.home_address !== undefined) updateData.home_address = data.home_address;
    if (data.emergency_contact_name !== undefined) updateData.emergency_contact_name = data.emergency_contact_name;
    if (data.emergency_contact_phone !== undefined) updateData.emergency_contact_phone = data.emergency_contact_phone;

    const profile = await prisma.patientProfile.upsert({
      where: { user_id: userId },
      create: { user_id: userId, chronic_conditions: [] },
      update: updateData
    });

    if (data.weight_kg !== undefined || data.height_cm !== undefined) {
      const currentProfile = await prisma.patientProfile.findUnique({ where: { user_id: userId } });
      if (currentProfile?.weight_kg && currentProfile?.height_cm) {
        const w = Number(currentProfile.weight_kg);
        const h = Number(currentProfile.height_cm) / 100;
        if (w > 0 && h > 0) {
          const bmi = Math.round((w / (h * h)) * 10) / 10;
          await prisma.patientVital.create({
            data: {
              patient_id: userId,
              recorded_by_user_id: userId,
              weight_kg: currentProfile.weight_kg,
              height_cm: currentProfile.height_cm,
              bmi,
              vital_source: "self"
            }
          });
        }
      }
    }

    return profile;
  }

  async updateDoctorProfile(userId: string, data: UpdateDoctorProfileDto) {
    const profile = await prisma.doctorProfile.findUnique({ where: { user_id: userId } });
    if (!profile) throw new AppError("Doctor profile not found", 404, "NOT_FOUND");

    if (data.languages_spoken) {
      for (const lang of data.languages_spoken) {
        if (!(ACCEPTED_LANGUAGES as readonly string[]).includes(lang)) {
          throw new AppError(`Invalid language: ${lang}`, 400, "INVALID_LANGUAGE");
        }
      }
    }

    if (data.consultation_types) {
      for (const type of data.consultation_types) {
        if (!(ACCEPTED_CONSULTATION_TYPES as readonly string[]).includes(type)) {
          throw new AppError(`Invalid consultation type: ${type}`, 400, "INVALID_CONSULTATION_TYPE");
        }
      }
    }

    const updateData: Prisma.DoctorProfileUpdateInput = {};
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.years_experience !== undefined) updateData.years_experience = data.years_experience;
    if (data.consultation_fee_etb !== undefined) updateData.consultation_fee_etb = data.consultation_fee_etb;
    if (data.languages_spoken !== undefined) updateData.languages_spoken = data.languages_spoken;
    if (data.clinic_address !== undefined) updateData.clinic_address = data.clinic_address;
    if (data.consultation_types !== undefined) updateData.consultation_types = data.consultation_types;

    return prisma.doctorProfile.update({ where: { user_id: userId }, data: updateData });
  }

  async updateDoctorVisibility(userId: string, data: UpdateDoctorVisibilityDto) {
    const profile = await prisma.doctorProfile.findUnique({ where: { user_id: userId } });
    if (!profile) throw new AppError("Doctor profile not found", 404, "NOT_FOUND");

    const updateData: Prisma.DoctorProfileUpdateInput = {};
    if (data.show_phone !== undefined) updateData.show_phone = data.show_phone;
    if (data.show_email !== undefined) updateData.show_email = data.show_email;
    if (data.show_hospital !== undefined) updateData.show_hospital = data.show_hospital;
    if (data.show_rating !== undefined) updateData.show_rating = data.show_rating;
    if (data.show_experience !== undefined) updateData.show_experience = data.show_experience;
    if (data.show_consultation_count !== undefined) updateData.show_consultation_count = data.show_consultation_count;

    return prisma.doctorProfile.update({ where: { user_id: userId }, data: updateData });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password_hash) throw new AppError("User not found", 404, "NOT_FOUND");

    const valid = await comparePassword(currentPassword, user.password_hash);
    if (!valid) throw new AppError("Current password is incorrect", 400, "INVALID_PASSWORD");

    const rateKey = `change-password-rate:${userId}:${new Date().toISOString().slice(0, 10)}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 86400);
    if (count > 5) throw new AppError("Too many password change attempts. Try again later.", 429, "RATE_LIMITED");

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password_hash: hashed } });

    await redisSet(`blacklist:user:${userId}`, "1", REFRESH_TTL_SECONDS);

    await emailService.sendPasswordChangeAlert(user.email!, user.full_name);
  }

  async send2FAOTP(userId: string, purpose: string): Promise<void> {
    const rateKey = `2fa-rate:${userId}:${Math.floor(Date.now() / 3600000)}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 3600);
    if (count > 3) throw new AppError("Too many OTP requests. Please try again later.", 429, "RATE_LIMITED");

    const otp = this.generateOTP();
    const hashedOtp = await bcrypt.hash(otp, OTP_COST);

    await prisma.twoFASession.create({
      data: {
        user_id: userId,
        otp: hashedOtp,
        purpose,
        expires_at: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const email = user?.pending_email ?? user?.email;
    if (!email) throw new AppError("No email address on file", 400, "NO_EMAIL");

    if (env.NODE_ENV === "development") {
      const logger = await import("../../utils/logger").then((m) => m.logger);
      logger.info(`DEV 2FA OTP for ${userId}: ${otp}`);
    }

    const subjectMap: Record<string, string> = {
      enable_2fa: "Enable 2FA on FCN",
      disable_2fa: "Disable 2FA on FCN",
      delete_account: "Confirm Account Deletion"
    };

    const subject = subjectMap[purpose] || "FCN Verification Code";
    const isDeletion = purpose === "delete_account";
    const codeColor = isDeletion ? "#F87171" : "#2DD4BF";
    const warning = isDeletion
      ? '<p style="margin:16px 0 0;color:#F87171;font-weight:700">WARNING: This action cannot be undone. All your health data will be anonymized.</p>'
      : "";

    const html = `
      <div style="background:#F8FFFE;padding:32px;font-family:Inter,Arial,sans-serif;color:#1E293B">
        <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(10,126,164,0.16);border-radius:12px;overflow:hidden">
          <div style="background:#0A7EA4;color:#FFFFFF;padding:20px 24px">
            <img src="${env.FRONTEND_URL}/logo/fcn-logo-full.png" alt="FCN" style="height:36px" />
          </div>
          <div style="padding:24px">
            <p style="margin:0 0 16px;font-size:16px">Use this one-time code to ${purpose.replace(/_/g, " ")}.</p>
            <div style="font-family:Consolas,monospace;font-size:38px;font-weight:800;letter-spacing:10px;color:${codeColor};text-align:center;padding:20px 0">${otp}</div>
            <p style="margin:16px 0 0;color:#475569">This code expires in 10 minutes.</p>
            <p style="margin:8px 0 0;color:#475569">If you didn't request this, ignore this email.</p>
            ${warning}
          </div>
          <div style="padding:16px 24px;background:#F8FFFE;color:#64748B;font-size:12px">FCN - Foundation Care Network</div>
        </div>
      </div>`;

    const emailServiceModule = await import("../auth/email.service");
    const es = emailServiceModule.emailService;
    await es.sendCustomEmail(email, subject, html);
  }

  async enable2FA(userId: string, otp: string): Promise<void> {
    const session = await prisma.twoFASession.findFirst({
      where: {
        user_id: userId,
        purpose: "enable_2fa",
        expires_at: { gt: new Date() },
        used: false
      },
      orderBy: { created_at: "desc" }
    });

    if (!session) throw new AppError("No valid OTP session found. Request a new code.", 400, "NO_OTP_SESSION");

    const valid = await bcrypt.compare(otp, session.otp);
    if (!valid) throw new AppError("Invalid or expired OTP", 422, "OTP_INVALID");

    await prisma.twoFASession.update({ where: { id: session.id }, data: { used: true } });
    await prisma.user.update({ where: { id: userId }, data: { two_fa_enabled: true } });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await emailService.send2FAEnabledEmail(user.email, user.full_name);
    }
  }

  async disable2FA(userId: string, otp: string): Promise<void> {
    const session = await prisma.twoFASession.findFirst({
      where: {
        user_id: userId,
        purpose: "disable_2fa",
        expires_at: { gt: new Date() },
        used: false
      },
      orderBy: { created_at: "desc" }
    });

    if (!session) throw new AppError("No valid OTP session found. Request a new code.", 400, "NO_OTP_SESSION");

    const valid = await bcrypt.compare(otp, session.otp);
    if (!valid) throw new AppError("Invalid or expired OTP", 422, "OTP_INVALID");

    await prisma.twoFASession.update({ where: { id: session.id }, data: { used: true } });
    await prisma.user.update({ where: { id: userId }, data: { two_fa_enabled: false } });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.email) {
      await emailService.send2FADisabledEmail(user.email, user.full_name);
    }
  }

  async initiateDelete(userId: string): Promise<{ email_hint: string }> {
    const rateKey = `delete-initiate-rate:${userId}:${new Date().toISOString().slice(0, 10)}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 86400);
    if (count > 3) throw new AppError("Too many deletion requests. Try again later.", 429, "RATE_LIMITED");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    await prisma.user.update({ where: { id: userId }, data: { deletion_requested_at: new Date() } });

    const otp = this.generateOTP();
    const hashedOtp = await bcrypt.hash(otp, OTP_COST);

    await prisma.twoFASession.create({
      data: {
        user_id: userId,
        otp: hashedOtp,
        purpose: "delete_account",
        expires_at: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    if (env.NODE_ENV === "development") {
      const logger = await import("../../utils/logger").then((m) => m.logger);
      logger.info(`DEV deletion OTP for ${userId}: ${otp}`);
    }

    const email = user.pending_email ?? user.email;
    if (!email) throw new AppError("No email address on file", 400, "NO_EMAIL");

    const masked = email.replace(/(?<=^.).*(?=.@)/, (m) => "*".repeat(m.length));
    const html = `
      <div style="background:#F8FFFE;padding:32px;font-family:Inter,Arial,sans-serif;color:#1E293B">
        <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(10,126,164,0.16);border-radius:12px;overflow:hidden">
          <div style="background:#DC2626;color:#FFFFFF;padding:20px 24px">
            <div style="font-size:24px;font-weight:800">FCN</div>
            <div style="font-size:13px;opacity:.9">Account Deletion Request</div>
          </div>
          <div style="padding:24px">
            <p style="margin:0 0 16px;font-size:16px">You requested to delete your FCN account. Enter this code to confirm.</p>
            <p style="margin:0 0 8px;color:#F87171;font-weight:700">WARNING: This action cannot be undone.</p>
            <p style="margin:0 0 16px;color:#F87171">All your health data will be anonymized per healthcare regulations.</p>
            <div style="font-family:Consolas,monospace;font-size:38px;font-weight:800;letter-spacing:10px;color:#DC2626;text-align:center;padding:20px 0">${otp}</div>
            <p style="margin:16px 0 0;color:#475569">This code expires in 10 minutes.</p>
            <p style="margin:8px 0 0;color:#475569">If you didn't request this, ignore this email.</p>
          </div>
          <div style="padding:16px 24px;background:#F8FFFE;color:#64748B;font-size:12px">FCN - Foundation Care Network</div>
        </div>
      </div>`;

    const emailServiceModule = await import("../auth/email.service");
    const es = emailServiceModule.emailService;
    await es.sendCustomEmail(email, "FCN Account Deletion Request", html);

    return { email_hint: masked };
  }

  async confirmDeleteOTP(userId: string, otp: string): Promise<{ deletion_token: string }> {
    const session = await prisma.twoFASession.findFirst({
      where: {
        user_id: userId,
        purpose: "delete_account",
        expires_at: { gt: new Date() },
        used: false
      },
      orderBy: { created_at: "desc" }
    });

    if (!session) throw new AppError("No valid OTP session found. Request a new code.", 400, "NO_OTP_SESSION");

    const valid = await bcrypt.compare(otp, session.otp);
    if (!valid) throw new AppError("Invalid or expired OTP", 422, "OTP_INVALID");

    await prisma.twoFASession.update({ where: { id: session.id }, data: { used: true } });
    await prisma.user.update({ where: { id: userId }, data: { deletion_confirmed_at: new Date() } });

    const deletionToken = jwt.sign(
      { userId, purpose: "delete" },
      env.JWT_SECRET,
      { expiresIn: "30s" }
    );

    return { deletion_token: deletionToken };
  }

  async finalDelete(userId: string, deletionToken: string, reason?: string): Promise<void> {
    try {
      const payload = jwt.verify(deletionToken, env.JWT_SECRET) as { userId: string; purpose: string };
      if (payload.userId !== userId || payload.purpose !== "delete") {
        throw new AppError("Invalid deletion token", 400, "INVALID_TOKEN");
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError("Deletion token expired or invalid. Please restart the process.", 400, "TOKEN_EXPIRED");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");

    const userEmail = user.email;
    const userName = user.full_name;

    await prisma.user.update({
      where: { id: userId },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        deletion_reason: reason ?? null,
        full_name: "Deleted User",
        email: null,
        phone: null,
        fcm_token: null,
        two_fa_enabled: false,
        two_fa_secret: null,
        deletion_requested_at: null,
        deletion_confirmed_at: null,
        pending_email: null,
        pending_phone: null,
        password_hash: null
      }
    });

    await prisma.patientProfile.updateMany({
      where: { user_id: userId },
      data: {
        home_address: null,
        emergency_contact_name: null,
        emergency_contact_phone: null
      }
    });

    await redisSet(`blacklist:user:${userId}`, "1", REFRESH_TTL_SECONDS);

    if (userEmail) {
      const html = `
        <div style="background:#F8FFFE;padding:32px;font-family:Inter,Arial,sans-serif;color:#1E293B">
          <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid rgba(10,126,164,0.16);border-radius:12px;overflow:hidden">
            <div style="background:#0A7EA4;color:#FFFFFF;padding:20px 24px">
              <div style="font-size:24px;font-weight:800">FCN</div>
              <div style="font-size:13px;opacity:.9">Account Deleted</div>
            </div>
            <div style="padding:24px">
              <h2 style="margin:0 0 12px;color:#1E293B">Account Deleted, ${userName}</h2>
              <p style="margin:0 0 16px">Your FCN account has been deleted. We're sorry to see you go.</p>
              <p style="margin:0 0 8px;color:#64748B">Your medical records have been anonymized and retained per Ethiopian healthcare regulations.</p>
              <p style="margin:16px 0 0;color:#64748B;font-size:13px">If this was a mistake, please contact support at support@fcncare.com</p>
            </div>
            <div style="padding:16px 24px;background:#F8FFFE;color:#64748B;font-size:12px">FCN - Foundation Care Network</div>
          </div>
        </div>`;

      const emailServiceModule = await import("../auth/email.service");
      const es = emailServiceModule.emailService;
      await es.sendCustomEmail(userEmail, "Your FCN account has been deleted", html);
    }
  }

  async getDoctorPublicProfile(doctorId: string) {
    const user = await prisma.user.findUnique({
      where: { id: doctorId, role: "doctor", is_deleted: false },
      include: {
        doctor_profile: {
          include: { hospital: { select: { name: true, location: true } } }
        }
      }
    });

    if (!user || !user.doctor_profile) {
      throw new AppError("Doctor not found", 404, "NOT_FOUND");
    }

    const dp = user.doctor_profile;
    const recentRatings = dp.show_rating
      ? await prisma.consultationRating.findMany({
          where: { doctor_id: doctorId },
          orderBy: { created_at: "desc" },
          take: 3,
          select: {
            id: true,
            rating: true,
            review_text: true,
            created_at: true,
            patient: { select: { full_name: true } }
          }
        })
      : [];

    const profile: Record<string, unknown> = {
      id: user.id,
      full_name: user.full_name,
      specialty: dp.specialty,
      availability_status: dp.availability_status,
      bio: dp.bio,
      photo_url: dp.photo_url,
      languages_spoken: dp.languages_spoken,
      consultation_types: dp.consultation_types,
      clinic_address: dp.clinic_address
    };

    if (dp.show_hospital && dp.hospital) {
      profile.hospital_name = dp.hospital.name;
      profile.hospital_location = dp.hospital.location;
    }
    if (dp.show_email) profile.email = user.email;
    if (dp.show_phone) profile.phone = user.phone;
    if (dp.show_rating) {
      profile.rating_average = Number(dp.rating_average);
      profile.rating_count = dp.rating_count;
    }
    if (dp.show_experience) profile.years_experience = dp.years_experience;
    if (dp.show_consultation_count) {
      const count = await prisma.appointment.count({ where: { doctor_id: doctorId, status: "completed" } });
      profile.consultation_count = count;
    }
    if (dp.show_rating) {
      profile.recent_ratings = recentRatings.map((r) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.review_text,
        created_at: r.created_at,
        patient: { full_name: r.patient.full_name }
      }));
    }

    return profile;
  }

  private generateOTP(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }
}

export const profileService = new ProfileService();

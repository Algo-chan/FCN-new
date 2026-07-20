import crypto from "crypto";
import type { Role, User } from "@prisma/client";
import { prisma } from "../../config/database";
import { redis, redisDel, redisGet, redisSet } from "../../config/redis";
import { env } from "../../config/env";
import { comparePassword, hashPassword } from "../../utils/bcrypt";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/app-error";
import type { AuthTokens } from "../../types";
import { emailService } from "./email.service";
import type { RegisterDto, RegisterStep2Dto } from "./auth.validators";

const REFRESH_TTL_SECONDS = 3 * 24 * 60 * 60;
const OTP_MAX_ATTEMPTS = 3;
const OTP_MAX_RESENDS = 3;
const OTP_TTL_SECONDS = 10 * 60;
const OTP_LOCK_TTL_SECONDS = 15 * 60;
type SafeUser = Omit<User, "password_hash"> & { patient_profile?: { onboarding_completed: boolean } | null };

export class AuthService {
  async register(data: RegisterDto): Promise<{ user: SafeUser; tokens?: AuthTokens }> {
    const passwordHash = await hashPassword(data.password);
    const status = data.role === "patient" ? "active" : "pending";

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          full_name: data.full_name,
          email: data.email,
          phone: null,
          password_hash: passwordHash,
          role: data.role,
          status,
          email_verified: false,
          phone_verified: false
        }
      });

      if (data.role === "patient") {
        await tx.patientProfile.create({ data: { user_id: created.id, chronic_conditions: [] } });
      }

      if (data.role === "doctor") {
        let hospital_id: string | undefined;

        if (data.hospital_id) {
          const hospital = await tx.hospital.findUnique({ where: { id: data.hospital_id } });
          if (!hospital) {
            throw new AppError("Selected hospital not found", 404, "NOT_FOUND");
          }
          if (!data.specialty || !hospital.specialties.includes(data.specialty)) {
            throw new AppError("Selected specialty is not offered by your affiliated hospital", 400, "INVALID_SPECIALTY_FOR_HOSPITAL");
          }
          hospital_id = hospital.id;
        }

        await tx.doctorProfile.create({
          data: {
            user_id: created.id,
            license_number: data.license_number!,
            specialty: data.specialty!,
            years_experience: data.years_experience ?? 0,
            hospital_id
          }
        });
      }

      if (data.role === "nurse" || data.role === "rural_health_officer") {
        await tx.nurseProfile.create({
          data: {
            user_id: created.id,
            license_number: data.nursing_license_number!,
            coverage_zone: data.coverage_zone!
          }
        });
      }

      return created;
    });

    emailService.sendWelcomeEmail(data.email, data.full_name, data.role).catch(() => {});

    const safeUser = await this.getMe(user.id);
    const tokens = user.status === "active" ? this.generateTokenPair(user.id, user.role, user.status) : undefined;
    return { user: safeUser, tokens };
  }

  async registerStep1(data: { full_name: string; email: string; password: string }): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError("An account with this email already exists", 409, "EMAIL_TAKEN");
    }

    const passwordHash = await hashPassword(data.password);
    const tempData = JSON.stringify({
      full_name: data.full_name,
      email: data.email,
      password_hash: passwordHash
    });
    await redisSet(`otp:register:data:${data.email}`, tempData, OTP_TTL_SECONDS);

    try {
      await this.sendOTP(data.email, "verification");
    } catch (err) {
      logger.warn("Failed to send registration OTP email, but OTP is stored in Redis", { email: data.email, error: (err as Error).message });
    }
  }

  async verifyRegistrationOTP(email: string, otp: string): Promise<boolean> {
    const lockKey = `otp:register:lock:${email}`;
    const isLocked = await redisGet(lockKey);
    if (isLocked) {
      throw new AppError("Too many failed attempts. Please try again later.", 423, "OTP_LOCKED");
    }

    const attemptsKey = `otp:register:attempts:${email}`;
    const attempts = parseInt((await redisGet(attemptsKey)) ?? "0");

    const verified = await this.verifyOTP(email, otp, "verification");

    if (!verified) {
      const newAttempts = attempts + 1;
      await redisSet(attemptsKey, String(newAttempts), OTP_LOCK_TTL_SECONDS);
      if (newAttempts >= OTP_MAX_ATTEMPTS) {
        await redisSet(lockKey, "1", OTP_LOCK_TTL_SECONDS);
        throw new AppError("Too many failed attempts. Please try again later.", 423, "OTP_LOCKED");
      }
      throw new AppError("Invalid or expired OTP", 422, "OTP_INVALID");
    }

    await redisDel(attemptsKey);
    await redisSet(`otp:register:verified:${email}`, "1", OTP_TTL_SECONDS);
    return true;
  }

  async registerStep2(email: string, roleData: RegisterStep2Dto): Promise<{ user: SafeUser; tokens?: AuthTokens }> {
    const verifiedKey = `otp:register:verified:${email}`;
    const isVerified = await redisGet(verifiedKey);
    if (!isVerified) {
      throw new AppError("OTP verification required. Please verify your email first.", 400, "OTP_NOT_VERIFIED");
    }

    const tempDataKey = `otp:register:data:${email}`;
    const tempDataStr = await redisGet(tempDataKey);
    if (!tempDataStr) {
      throw new AppError("Registration session expired. Please start over.", 400, "SESSION_EXPIRED");
    }

    const tempData = JSON.parse(tempDataStr) as { full_name: string; email: string; password_hash: string };
    await redisDel(tempDataKey);
    await redisDel(verifiedKey);

    const status = roleData.role === "patient" ? "active" : "pending";

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          full_name: tempData.full_name,
          email: tempData.email,
          phone: null,
          password_hash: tempData.password_hash,
          role: roleData.role,
          status,
          email_verified: true,
          phone_verified: false
        }
      });

      if (roleData.role === "patient") {
        await tx.patientProfile.create({ data: { user_id: created.id, chronic_conditions: [] } });
      }

      if (roleData.role === "doctor") {
        let hospital_id: string | undefined;

        if (roleData.hospital_id) {
          const hospital = await tx.hospital.findUnique({ where: { id: roleData.hospital_id } });
          if (!hospital) {
            throw new AppError("Selected hospital not found", 404, "NOT_FOUND");
          }
          if (!roleData.specialty || !hospital.specialties.includes(roleData.specialty)) {
            throw new AppError("Selected specialty is not offered by your affiliated hospital", 400, "INVALID_SPECIALTY_FOR_HOSPITAL");
          }
          hospital_id = hospital.id;
        }

        await tx.doctorProfile.create({
          data: {
            user_id: created.id,
            license_number: roleData.license_number!,
            specialty: roleData.specialty!,
            years_experience: roleData.years_experience ?? 0,
            hospital_id
          }
        });
      }

      if (roleData.role === "nurse" || roleData.role === "rural_health_officer") {
        await tx.nurseProfile.create({
          data: {
            user_id: created.id,
            license_number: roleData.nursing_license_number!,
            coverage_zone: roleData.coverage_zone!
          }
        });
      }

      return created;
    });

    emailService.sendWelcomeEmail(tempData.email, tempData.full_name, roleData.role).catch(() => {});

    const safeUser = await this.getMe(user.id);
    const tokens = user.status === "active" ? this.generateTokenPair(user.id, user.role, user.status) : undefined;
    return { user: safeUser, tokens };
  }

  async resendOTP(email: string, purpose: "registration" | "login"): Promise<void> {
    const resendKey = `otp:resend:${purpose}:${email}`;
    const resendCount = parseInt((await redisGet(resendKey)) ?? "0");
    if (resendCount >= OTP_MAX_RESENDS) {
      throw new AppError("Maximum resend limit reached. Please try again later.", 429, "RESEND_LIMITED");
    }

    await redisSet(resendKey, String(resendCount + 1), OTP_LOCK_TTL_SECONDS);

    try {
      if (purpose === "registration") {
        await this.sendOTP(email, "verification");
      } else {
        await this.sendOTP(email, "login");
      }
    } catch (err) {
      logger.warn("Failed to resend OTP email, but OTP is stored in Redis", { email, purpose, error: (err as Error).message });
    }
  }

  async login(email: string, password: string): Promise<{ user?: SafeUser; tokens?: AuthTokens; requiresOTP: boolean; email: string }> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (!user.password_hash) {
      throw new AppError("This account uses Google Sign-In. Please log in with Google.", 400, "GOOGLE_ACCOUNT_ONLY");
    }

    if (!(await comparePassword(password, user.password_hash))) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (user.status === "suspended") {
      throw new AppError("Your account has been suspended", 403, "ACCOUNT_SUSPENDED");
    }
    if (user.status === "rejected") {
      throw new AppError("Your account application was rejected", 403, "ACCOUNT_REJECTED");
    }

    if (user.role === "super_admin") {
      await prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } });
      return { user: await this.getMe(user.id), tokens: this.generateTokenPair(user.id, user.role, user.status), requiresOTP: false, email };
    }

    try {
      await this.sendOTP(email, "login");
    } catch (err) {
      logger.warn("Failed to send login OTP email, but OTP is stored in Redis", { email, error: (err as Error).message });
    }
    return { requiresOTP: true, email };
  }

  async verifyLoginOTP(email: string, otp: string): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const lockKey = `otp:login:lock:${email}`;
    const isLocked = await redisGet(lockKey);
    if (isLocked) {
      throw new AppError("Too many failed attempts. Please try again later.", 423, "OTP_LOCKED");
    }

    const attemptsKey = `otp:login:attempts:${email}`;
    const attempts = parseInt((await redisGet(attemptsKey)) ?? "0");

    const key = `otp:login:${email}`;
    const stored = await redisGet(key);
    if (!stored) {
      const newAttempts = attempts + 1;
      await redisSet(attemptsKey, String(newAttempts), OTP_LOCK_TTL_SECONDS);
      if (newAttempts >= OTP_MAX_ATTEMPTS) {
        await redisSet(lockKey, "1", OTP_LOCK_TTL_SECONDS);
        throw new AppError("Too many failed attempts. Please try again later.", 423, "OTP_LOCKED");
      }
      throw new AppError("Invalid or expired OTP", 422, "OTP_INVALID");
    }

    const submittedHash = crypto.createHash("sha256").update(otp).digest("hex");
    let match = false;
    try {
      match = crypto.timingSafeEqual(Buffer.from(stored, "hex"), Buffer.from(submittedHash, "hex"));
    } catch {
      match = false;
    }

    if (!match) {
      const newAttempts = attempts + 1;
      await redisSet(attemptsKey, String(newAttempts), OTP_LOCK_TTL_SECONDS);
      if (newAttempts >= OTP_MAX_ATTEMPTS) {
        await redisSet(lockKey, "1", OTP_LOCK_TTL_SECONDS);
        throw new AppError("Too many failed attempts. Please try again later.", 423, "OTP_LOCKED");
      }
      throw new AppError("Invalid or expired OTP", 422, "OTP_INVALID");
    }

    await redisDel(key);
    await redisDel(attemptsKey);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    await prisma.user.update({ where: { id: user.id }, data: { last_login_at: new Date() } });
    return { user: await this.getMe(user.id), tokens: this.generateTokenPair(user.id, user.role, user.status) };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);

    if (await redisGet(`blacklist:user:${payload.id}`)) {
      throw new AppError("Refresh token has been revoked", 401, "TOKEN_REVOKED");
    }

    const blacklistKey = this.refreshBlacklistKey(refreshToken);
    const locked = await redis.set(blacklistKey, "1", "EX", REFRESH_TTL_SECONDS, "NX");
    if (!locked) {
      throw new AppError("Refresh token has been revoked", 401, "TOKEN_REVOKED");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.status === "suspended" || user.status === "rejected") {
      throw new AppError("User account is not active", 403, "ACCOUNT_INACTIVE");
    }

    return this.generateTokenPair(user.id, user.role, user.status);
  }

  async logout(refreshToken: string): Promise<void> {
    if (refreshToken) {
      await redisSet(this.refreshBlacklistKey(refreshToken), "1", REFRESH_TTL_SECONDS);
    }
  }

  async sendOTP(email: string, purpose: "verification" | "reset" | "login"): Promise<void> {
    const rateKey = `otp-rate:${purpose}:${email}`;
    const count = await redis.incr(rateKey);
    if (count === 1) {
      await redis.expire(rateKey, 60 * 60);
    }
    if (count > 3) {
      throw new AppError("Too many OTP requests. Please try again later.", 429, "RATE_LIMITED");
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    await redisSet(`otp:${purpose}:${email}`, otpHash, OTP_TTL_SECONDS);

    if (env.NODE_ENV === "development") {
      logger.info(`DEV OTP for ${email}: ${otp}`);
    }

    try {
      await emailService.sendOTPEmail(email, otp, purpose === "login" ? "verification" : purpose);
    } catch (err) {
      logger.warn(`SMTP failed for ${email}, falling back to log`, { error: (err as Error).message });
      logger.info(`OTP for ${email}: ${otp}`);
    }
  }

  async verifyOTP(email: string, otp: string, purpose: "verification" | "reset" | "login"): Promise<boolean> {
    const key = `otp:${purpose}:${email}`;
    const stored = await redisGet(key);
    if (!stored) {
      return false;
    }
    const submittedHash = crypto.createHash("sha256").update(otp).digest("hex");
    try {
      const match = crypto.timingSafeEqual(Buffer.from(stored, "hex"), Buffer.from(submittedHash, "hex"));
      if (match) {
        await redisDel(key);
      }
      return match;
    } catch {
      return false;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return;
    }
    await this.sendOTP(email, "reset");
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    if (!(await this.verifyOTP(email, otp, "reset"))) {
      throw new AppError("Invalid or expired OTP", 422, "OTP_INVALID");
    }

    const user = await prisma.user.update({
      where: { email },
      data: { password_hash: await hashPassword(newPassword) }
    });

    await redisSet(`blacklist:user:${user.id}`, "1", REFRESH_TTL_SECONDS);
  }

  async googleAuth(googleUser: { googleId: string; email: string; full_name: string; avatar?: string }): Promise<{ user?: SafeUser; tokens?: AuthTokens; isNewUser: boolean; googleProfile?: { email: string; full_name: string; googleId: string } }> {
    let user = await prisma.user.findFirst({
      where: { OR: [{ email: googleUser.email }, { google_id: googleUser.googleId }] }
    });

    if (user && !user.google_id) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { google_id: googleUser.googleId }
      });
    }

    if (!user) {
      return {
        isNewUser: true,
        googleProfile: { email: googleUser.email, full_name: googleUser.full_name, googleId: googleUser.googleId }
      };
    }

    if (user.status === "suspended") {
      throw new AppError("Your account has been suspended", 403, "ACCOUNT_SUSPENDED");
    }
    if (user.status === "rejected") {
      throw new AppError("Your account application was rejected", 403, "ACCOUNT_REJECTED");
    }

    return {
      isNewUser: false,
      user: await this.getMe(user.id),
      tokens: this.generateTokenPair(user.id, user.role, user.status)
    };
  }

  async registerGoogleUser(data: {
    googleId: string;
    email: string;
    full_name: string;
    role: "patient" | "doctor" | "nurse" | "rural_health_officer";
    license_number?: string;
    specialty?: string;
    hospital_id?: string;
    years_experience?: number;
    nursing_license_number?: string;
    coverage_zone?: string;
  }): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError("An account with this email already exists", 409, "EMAIL_TAKEN");
    }

    const status = data.role === "patient" ? "active" : "pending";

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          full_name: data.full_name,
          email: data.email,
          phone: null,
          password_hash: null,
          google_id: data.googleId,
          role: data.role,
          status,
          email_verified: true,
          phone_verified: false
        }
      });

      if (data.role === "patient") {
        await tx.patientProfile.create({ data: { user_id: created.id, chronic_conditions: [] } });
      }

      if (data.role === "doctor") {
        let hospital_id: string | undefined;

        if (data.hospital_id) {
          const hospital = await tx.hospital.findUnique({ where: { id: data.hospital_id } });
          if (!hospital) {
            throw new AppError("Selected hospital not found", 404, "NOT_FOUND");
          }
          if (!data.specialty || !hospital.specialties.includes(data.specialty)) {
            throw new AppError("Selected specialty is not offered by your affiliated hospital", 400, "INVALID_SPECIALTY_FOR_HOSPITAL");
          }
          hospital_id = hospital.id;
        }

        await tx.doctorProfile.create({
          data: {
            user_id: created.id,
            license_number: data.license_number!,
            specialty: data.specialty!,
            years_experience: data.years_experience ?? 0,
            hospital_id
          }
        });
      }

      if (data.role === "nurse" || data.role === "rural_health_officer") {
        await tx.nurseProfile.create({
          data: {
            user_id: created.id,
            license_number: data.nursing_license_number!,
            coverage_zone: data.coverage_zone!
          }
        });
      }

      return created;
    });

    emailService.sendWelcomeEmail(data.email, data.full_name, data.role).catch(() => {});

    const safeUser = await this.getMe(user.id);
    const tokens = this.generateTokenPair(user.id, user.role, user.status);
    return { user: safeUser, tokens };
  }

  async getMe(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient_profile: true,
        doctor_profile: true,
        nurse_profile: true
      }
    });

    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    const { password_hash: _passwordHash, ...safeUser } = user;
    return safeUser as SafeUser;
  }

  generateTokenPair(userId: string, role: Role, status: User["status"]): AuthTokens {
    return {
      accessToken: generateAccessToken(userId, role, status),
      refreshToken: generateRefreshToken(userId)
    };
  }

  private refreshBlacklistKey(refreshToken: string): string {
    return `blacklist:refresh:${crypto.createHash("sha256").update(refreshToken).digest("hex")}`;
  }
}

export const authService = new AuthService();

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
import type { RegisterDto } from "./auth.validators";

const REFRESH_TTL_SECONDS = 3 * 24 * 60 * 60;
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

  async login(email: string, password: string): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password_hash || !(await comparePassword(password, user.password_hash))) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (user.status === "suspended") {
      throw new AppError("Your account has been suspended", 403, "ACCOUNT_SUSPENDED");
    }
    if (user.status === "rejected") {
      throw new AppError("Your account application was rejected", 403, "ACCOUNT_REJECTED");
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

  async sendOTP(email: string, purpose: "verification" | "reset"): Promise<void> {
    const rateKey = `otp-rate:${purpose}:${email}`;
    const count = await redis.incr(rateKey);
    if (count === 1) {
      await redis.expire(rateKey, 60 * 60);
    }
    if (count > 3) {
      throw new AppError("Too many OTP requests. Please try again later.", 429, "RATE_LIMITED");
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    await redisSet(`otp:${purpose}:${email}`, otp, 10 * 60);

    if (env.NODE_ENV === "development") {
      logger.info(`DEV OTP for ${email}: ${otp}`);
    }

    await emailService.sendOTPEmail(email, otp, purpose);
  }

  async verifyOTP(email: string, otp: string, purpose: "verification" | "reset"): Promise<boolean> {
    const key = `otp:${purpose}:${email}`;
    const stored = await redisGet(key);
    if (!stored || stored !== otp) {
      return false;
    }
    await redisDel(key);
    return true;
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

  async googleAuth(googleUser: { googleId: string; email: string; full_name: string; avatar?: string }): Promise<{ user: SafeUser; tokens: AuthTokens; isNewUser: boolean }> {
    let isNewUser = false;
    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      isNewUser = true;
      user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            full_name: googleUser.full_name,
            email: googleUser.email,
            phone: null,
            password_hash: null,
            role: "patient",
            status: "active",
            email_verified: true,
            phone_verified: false
          }
        });
        await tx.patientProfile.create({ data: { user_id: created.id, chronic_conditions: [] } });
        return created;
      });
    }

    if (user.status === "suspended") {
      throw new AppError("Your account has been suspended", 403, "ACCOUNT_SUSPENDED");
    }
    if (user.status === "rejected") {
      throw new AppError("Your account application was rejected", 403, "ACCOUNT_REJECTED");
    }

    return {
      user: await this.getMe(user.id),
      tokens: this.generateTokenPair(user.id, user.role, user.status),
      isNewUser
    };
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

  private generateTokenPair(userId: string, role: Role, status: User["status"]): AuthTokens {
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

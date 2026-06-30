import type { Request, Response, NextFunction } from "express";
import type { GooglePassportUser } from "../../config/passport";
import { env } from "../../config/env";
import { prisma } from "../../config/database";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { authService } from "./auth.service";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  SendOTPSchema,
  VerifyOTPSchema
} from "./auth.validators";

const REFRESH_COOKIE = "fcn_refresh_token";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/v1/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const readRefreshToken = (req: Request): string | undefined => {
  const cookie = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${REFRESH_COOKIE}=`));

  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : req.body?.refreshToken;
};

export const registerController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = RegisterSchema.parse(req.body);
    const result = await authService.register(data);

    if (result.tokens) {
      res.cookie(REFRESH_COOKIE, result.tokens.refreshToken, cookieOptions);
      successResponse(res, { user: result.user, accessToken: result.tokens.accessToken }, 201);
      return;
    }

    successResponse(
      res,
      {
        user: result.user,
        requiresApproval: true,
        message: "Your account is under review"
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = LoginSchema.parse(req.body);
    const { user, tokens } = await authService.login(data.email, data.password);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);
    successResponse(res, { user, accessToken: tokens.accessToken });
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logout(readRefreshToken(req) ?? "");
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
    successResponse(res, { message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const refreshTokenController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = readRefreshToken(req);
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401, "UNAUTHORIZED");
    }

    const tokens = await authService.refreshToken(refreshToken);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);
    successResponse(res, { accessToken: tokens.accessToken });
  } catch (error) {
    next(error);
  }
};

export const sendOTPController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = SendOTPSchema.parse(req.body);
    await authService.sendOTP(data.email, "verification");
    successResponse(res, { message: "OTP sent to your email" });
  } catch (error) {
    next(error);
  }
};

export const verifyOTPController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = VerifyOTPSchema.parse(req.body);
    const verified = await authService.verifyOTP(data.email, data.otp, "verification");

    if (!verified) {
      throw new AppError("Invalid or expired OTP", 422, "OTP_INVALID");
    }

    await prisma.user.update({ where: { email: data.email }, data: { email_verified: true } });
    successResponse(res, { verified: true });
  } catch (error) {
    next(error);
  }
};

export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = ForgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(data.email);
    successResponse(res, { message: "If that email exists, a reset code has been sent" });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = ResetPasswordSchema.parse(req.body);
    await authService.resetPassword(data.email, data.otp, data.new_password);
    successResponse(res, { message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};

export const googleCallbackController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const passportUser = req.user as GooglePassportUser | undefined;
    if (!passportUser) {
      throw new AppError("Google authentication failed", 401, "GOOGLE_AUTH_FAILED");
    }

    const { user, tokens, isNewUser } = await authService.googleAuth({
      googleId: passportUser.googleId,
      email: passportUser.email,
      full_name: passportUser.full_name,
      avatar: passportUser.avatar
    });

    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);

    const destination =
      isNewUser
        ? "/onboarding"
        : (user.role === "doctor" || user.role === "nurse") && user.status === "pending"
          ? "/pending"
          : user.role === "super_admin"
            ? "/admin"
            : "/dashboard";

    res.redirect(`${env.FRONTEND_URL}${destination}?accessToken=${encodeURIComponent(tokens.accessToken)}`);
  } catch (error) {
    next(error);
  }
};

export const getMeController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Authentication is required", 401, "UNAUTHORIZED");
    }

    successResponse(res, await authService.getMe(req.user.id));
  } catch (error) {
    next(error);
  }
};

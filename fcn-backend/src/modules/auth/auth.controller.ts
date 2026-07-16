import type { Request, Response, NextFunction } from "express";
import type { GooglePassportUser } from "../../config/passport";
import { env } from "../../config/env";
import { prisma } from "../../config/database";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { authService } from "./auth.service";
import {
  ForgotPasswordSchema,
  LoginOTPSchema,
  LoginSchema,
  RegisterGoogleSchema,
  RegisterSchema,
  RegisterStep1Schema,
  RegisterStep2Schema,
  ResendOTPSchema,
  ResetPasswordSchema,
  SendOTPSchema,
  VerifyOTPSchema,
  VerifyRegistrationOTPSchema
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

  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : undefined;
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
    const result = await authService.login(data.email, data.password);

    if (result.requiresOTP) {
      successResponse(res, { requiresOTP: true, email: result.email });
      return;
    }

    res.cookie(REFRESH_COOKIE, result.tokens!.refreshToken, cookieOptions);
    successResponse(res, { user: result.user, accessToken: result.tokens!.accessToken });
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

    if (passportUser.isNewGoogleUser) {
      const params = new URLSearchParams({
        googleRegister: "true",
        googleId: passportUser.googleId,
        email: passportUser.email,
        name: passportUser.full_name
      });
      res.redirect(`${env.FRONTEND_URL}/register?${params.toString()}`);
      return;
    }

    const tokens = authService.generateTokenPair(passportUser.id, passportUser.role, passportUser.status);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOptions);

    const destination =
      (passportUser.role === "doctor" || passportUser.role === "nurse") && passportUser.status === "pending"
        ? "/pending"
        : passportUser.role === "super_admin"
          ? "/admin"
          : "/dashboard";

    res.redirect(`${env.FRONTEND_URL}/auth/callback?accessToken=${encodeURIComponent(tokens.accessToken)}&destination=${encodeURIComponent(destination)}`);
  } catch (error) {
    next(error);
  }
};

export const registerGoogleController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = RegisterGoogleSchema.parse(req.body);
    const result = await authService.registerGoogleUser(data);

    res.cookie(REFRESH_COOKIE, result.tokens.refreshToken, cookieOptions);

    if (result.user.status === "active") {
      successResponse(res, { user: result.user, accessToken: result.tokens.accessToken }, 201);
    } else {
      successResponse(res, { user: result.user, requiresApproval: true, message: "Your account is under review" }, 201);
    }
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

export const registerStep1Controller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = RegisterStep1Schema.parse(req.body);
    await authService.registerStep1(data);
    successResponse(res, { message: "OTP sent to your email" });
  } catch (error) {
    next(error);
  }
};

export const verifyRegistrationOTPController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = VerifyRegistrationOTPSchema.parse(req.body);
    await authService.verifyRegistrationOTP(data.email, data.otp);
    successResponse(res, { verified: true });
  } catch (error) {
    next(error);
  }
};

export const registerStep2Controller = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = RegisterStep2Schema.parse(req.body);
    const result = await authService.registerStep2(data.email, data);

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

export const loginVerifyOTPController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = LoginOTPSchema.parse(req.body);
    const result = await authService.verifyLoginOTP(data.email, data.otp);
    res.cookie(REFRESH_COOKIE, result.tokens.refreshToken, cookieOptions);
    successResponse(res, { user: result.user, accessToken: result.tokens.accessToken });
  } catch (error) {
    next(error);
  }
};

export const resendOTPController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = ResendOTPSchema.parse(req.body);
    await authService.resendOTP(data.email, data.purpose);
    successResponse(res, { message: "OTP resent to your email" });
  } catch (error) {
    next(error);
  }
};

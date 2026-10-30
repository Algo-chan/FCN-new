import { Router } from "express";
import passport from "passport";
import { env } from "../../config/env";
import { authMiddleware } from "../../middleware/auth.middleware";
import { redisRateLimit } from "../../middleware/rate-limit.middleware";
import { uploadFlexibleImageMiddleware } from "../../middleware/upload.middleware";
import { errorResponse } from "../../utils/response";
import {
  forgotPasswordController,
  getMeController,
  googleCallbackController,
  loginController,
  loginVerifyOTPController,
  logoutController,
  refreshTokenController,
  registerController,
  registerGoogleController,
  registerStep1Controller,
  registerStep2Controller,
  resendOTPController,
  resetPasswordController,
  sendOTPController,
  verifyOTPController,
  verifyRegistrationOTPController,
  uploadRegistrationPhotoController
} from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/register", redisRateLimit({ keyPrefix: "auth-register", maxRequests: 3, windowSeconds: 60 * 60 }), registerController);
authRoutes.post("/register/step1", redisRateLimit({ keyPrefix: "auth-register-step1", maxRequests: 5, windowSeconds: 60 * 60 }), registerStep1Controller);
authRoutes.post("/register/verify-otp", redisRateLimit({ keyPrefix: "auth-verify-otp", maxRequests: 10, windowSeconds: 60 * 60 }), verifyRegistrationOTPController);
authRoutes.post("/register/step2", registerStep2Controller);
authRoutes.post("/register/upload-photo", redisRateLimit({ keyPrefix: "auth-upload-photo", maxRequests: 10, windowSeconds: 60 * 15 }), uploadFlexibleImageMiddleware, uploadRegistrationPhotoController);
authRoutes.post("/register-google", redisRateLimit({ keyPrefix: "auth-register-google", maxRequests: 5, windowSeconds: 60 * 60 }), registerGoogleController);
authRoutes.post("/login", redisRateLimit({ keyPrefix: "auth-login", maxRequests: 5, windowSeconds: 15 * 60 }), loginController);
authRoutes.post("/login/verify-otp", redisRateLimit({ keyPrefix: "auth-login-verify-otp", maxRequests: 5, windowSeconds: 15 * 60 }), loginVerifyOTPController);
authRoutes.post("/logout", logoutController);
authRoutes.post("/refresh", redisRateLimit({ keyPrefix: "auth-refresh", maxRequests: 30, windowSeconds: 60 }), refreshTokenController);
authRoutes.post("/send-otp", redisRateLimit({ keyPrefix: "auth-send-otp", maxRequests: 10, windowSeconds: 60 * 60 }), sendOTPController);
authRoutes.post("/verify-otp", redisRateLimit({ keyPrefix: "auth-verify-otp-general", maxRequests: 10, windowSeconds: 60 * 60 }), verifyOTPController);
authRoutes.post("/resend-otp", redisRateLimit({ keyPrefix: "auth-resend-otp", maxRequests: 10, windowSeconds: 60 * 60 }), resendOTPController);
authRoutes.post("/forgot-password", redisRateLimit({ keyPrefix: "auth-forgot-password", maxRequests: 5, windowSeconds: 60 * 60 }), forgotPasswordController);
authRoutes.post("/reset-password", redisRateLimit({ keyPrefix: "auth-reset-password", maxRequests: 5, windowSeconds: 60 * 60 }), resetPasswordController);
authRoutes.get("/google", (req, res, next) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    errorResponse(res, "Google OAuth is not configured", 503, "GOOGLE_NOT_CONFIGURED");
    return;
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
authRoutes.get(
  "/google/callback",
  (req, res, next) => {
    const isLocal = req.headers.host?.includes("localhost") || req.headers.host?.includes("127.0.0.1");
    const failureRedirect = `${isLocal ? "http://localhost:5173" : env.FRONTEND_URL}/login?error=google`;
    passport.authenticate("google", { failureRedirect })(req, res, next);
  },
  googleCallbackController
);
authRoutes.get("/me", authMiddleware, getMeController);

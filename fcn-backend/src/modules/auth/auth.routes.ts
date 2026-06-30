import { Router } from "express";
import passport from "passport";
import { env } from "../../config/env";
import { authMiddleware } from "../../middleware/auth.middleware";
import { redisRateLimit } from "../../middleware/rate-limit.middleware";
import { errorResponse } from "../../utils/response";
import {
  forgotPasswordController,
  getMeController,
  googleCallbackController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resetPasswordController,
  sendOTPController,
  verifyOTPController
} from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/register", redisRateLimit({ keyPrefix: "auth-register", maxRequests: 3, windowSeconds: 60 * 60 }), registerController);
authRoutes.post("/login", redisRateLimit({ keyPrefix: "auth-login", maxRequests: 5, windowSeconds: 15 * 60 }), loginController);
authRoutes.post("/logout", logoutController);
authRoutes.post("/refresh", refreshTokenController);
authRoutes.post("/send-otp", redisRateLimit({ keyPrefix: "auth-send-otp", maxRequests: 10, windowSeconds: 60 * 60 }), sendOTPController);
authRoutes.post("/verify-otp", verifyOTPController);
authRoutes.post("/forgot-password", forgotPasswordController);
authRoutes.post("/reset-password", resetPasswordController);
authRoutes.get("/google", (req, res, next) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    errorResponse(res, "Google OAuth is not configured", 503, "GOOGLE_NOT_CONFIGURED");
    return;
  }
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
});
authRoutes.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${env.FRONTEND_URL}/login?error=google` }),
  googleCallbackController
);
authRoutes.get("/me", authMiddleware, getMeController);

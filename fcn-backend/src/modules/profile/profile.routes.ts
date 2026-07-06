import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import { validate } from "../../middleware/validate.middleware";
import {
  UpdateProfileSchema,
  UpdatePatientProfileSchema,
  UpdateDoctorProfileSchema,
  UpdateDoctorVisibilitySchema,
  ChangePasswordSchema,
  Send2FAOTPSchema,
  VerifyOTPSchema,
  FinalDeleteSchema,
  ConfirmDeleteOTPSchema
} from "./profile.validators";
import {
  getMyProfileController,
  updateProfileController,
  updatePatientProfileController,
  updateDoctorProfileController,
  updateDoctorVisibilityController,
  changePasswordController,
  send2FAOTPController,
  enable2FAController,
  disable2FAController,
  initiateDeleteController,
  confirmDeleteOTPController,
  finalDeleteController,
  getDoctorPublicProfileController
} from "./profile.controller";

export const profileRoutes = Router();

profileRoutes.get("/me", authMiddleware, getMyProfileController);
profileRoutes.patch("/me", authMiddleware, validate(UpdateProfileSchema), updateProfileController);
profileRoutes.patch("/me/patient-profile", authMiddleware, requireRole("patient"), validate(UpdatePatientProfileSchema), updatePatientProfileController);
profileRoutes.patch("/me/doctor-profile", authMiddleware, requireRole("doctor"), validate(UpdateDoctorProfileSchema), updateDoctorProfileController);
profileRoutes.patch("/me/doctor-visibility", authMiddleware, requireRole("doctor"), validate(UpdateDoctorVisibilitySchema), updateDoctorVisibilityController);

profileRoutes.post("/security/change-password", authMiddleware, validate(ChangePasswordSchema), changePasswordController);
profileRoutes.post("/security/send-2fa-otp", authMiddleware, validate(Send2FAOTPSchema), send2FAOTPController);
profileRoutes.post("/security/enable-2fa", authMiddleware, validate(VerifyOTPSchema), enable2FAController);
profileRoutes.post("/security/disable-2fa", authMiddleware, validate(VerifyOTPSchema), disable2FAController);

profileRoutes.post("/delete/initiate", authMiddleware, initiateDeleteController);
profileRoutes.post("/delete/confirm-otp", authMiddleware, validate(ConfirmDeleteOTPSchema), confirmDeleteOTPController);
profileRoutes.post("/delete/final-confirm", authMiddleware, validate(FinalDeleteSchema), finalDeleteController);

profileRoutes.get("/doctors/:doctorId/public", getDoctorPublicProfileController);

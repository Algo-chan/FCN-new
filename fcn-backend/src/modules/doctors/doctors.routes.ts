import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import { requireFeature } from "../../middleware/feature-flag.middleware";
import { uploadMiddleware } from "../../middleware/upload.middleware";
import {
  getAllDoctorsController,
  getAvailableSpecialtiesController,
  getAvailableCitiesController,
  getDoctorByIdController,
  getDoctorAvailabilityController,
  updateAvailabilityStatusController,
  updateDoctorProfileController,
  uploadProfilePhotoController,
  deleteProfilePhotoController
} from "./doctors.controller";

export const doctorRoutes = Router();

doctorRoutes.get("/", requireFeature("FEATURE_PUBLIC_DOCTORS"), getAllDoctorsController);
doctorRoutes.get("/specialties", requireFeature("FEATURE_PUBLIC_DOCTORS"), getAvailableSpecialtiesController);
doctorRoutes.get("/cities", requireFeature("FEATURE_PUBLIC_DOCTORS"), getAvailableCitiesController);
doctorRoutes.get("/:id", requireFeature("FEATURE_PUBLIC_DOCTORS"), getDoctorByIdController);
doctorRoutes.get("/:id/availability", requireFeature("FEATURE_PUBLIC_DOCTORS"), getDoctorAvailabilityController);
doctorRoutes.patch("/me/availability", authMiddleware, requireRole("doctor"), updateAvailabilityStatusController);
doctorRoutes.patch("/me/profile", authMiddleware, requireRole("doctor"), updateDoctorProfileController);
doctorRoutes.post("/me/photo", authMiddleware, requireRole("doctor"), uploadMiddleware, uploadProfilePhotoController);
doctorRoutes.delete("/me/photo", authMiddleware, requireRole("doctor"), deleteProfilePhotoController);
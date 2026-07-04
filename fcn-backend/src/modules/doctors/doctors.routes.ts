import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import { uploadMiddleware } from "../../middleware/upload.middleware";
import {
  getAllDoctorsController,
  getAvailableSpecialtiesController,
  getDoctorByIdController,
  getDoctorAvailabilityController,
  updateAvailabilityStatusController,
  updateDoctorProfileController,
  uploadProfilePhotoController,
  deleteProfilePhotoController
} from "./doctors.controller";

export const doctorRoutes = Router();

doctorRoutes.get("/", authMiddleware, getAllDoctorsController);
doctorRoutes.get("/specialties", authMiddleware, getAvailableSpecialtiesController);
doctorRoutes.get("/:id", authMiddleware, getDoctorByIdController);
doctorRoutes.get("/:id/availability", authMiddleware, getDoctorAvailabilityController);
doctorRoutes.patch("/me/availability", authMiddleware, requireRole("doctor"), updateAvailabilityStatusController);
doctorRoutes.patch("/me/profile", authMiddleware, requireRole("doctor"), updateDoctorProfileController);
doctorRoutes.post("/me/photo", authMiddleware, requireRole("doctor"), uploadMiddleware, uploadProfilePhotoController);
doctorRoutes.delete("/me/photo", authMiddleware, requireRole("doctor"), deleteProfilePhotoController);

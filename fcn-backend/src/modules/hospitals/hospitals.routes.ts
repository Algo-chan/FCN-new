import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import { requireHospitalScope } from "../../middleware/hospital-scope.middleware";
import {
  createHospitalAdminController,
  createHospitalController,
  getAllHospitalsController,
  getHospitalAdminsController,
  getHospitalByIdController,
  getHospitalSpecialtiesController,
  updateHospitalController,
  updateHospitalStatusController,
  updateOccupancyController
} from "./hospitals.controller";

export const hospitalRoutes = Router();

hospitalRoutes.get("/", getAllHospitalsController);
hospitalRoutes.get("/:id", authMiddleware, getHospitalByIdController);
hospitalRoutes.get("/:id/specialties", getHospitalSpecialtiesController);
hospitalRoutes.patch("/:id/occupancy", authMiddleware, requireRole("hospital_admin", "super_admin"), requireHospitalScope, updateOccupancyController);
hospitalRoutes.post("/", authMiddleware, requireRole("super_admin"), createHospitalController);
hospitalRoutes.patch("/:id", authMiddleware, requireRole("super_admin"), updateHospitalController);
hospitalRoutes.patch("/:id/status", authMiddleware, requireRole("super_admin"), updateHospitalStatusController);
hospitalRoutes.get("/:id/admins", authMiddleware, requireRole("super_admin"), getHospitalAdminsController);
hospitalRoutes.post("/:id/admins", authMiddleware, requireRole("super_admin"), createHospitalAdminController);

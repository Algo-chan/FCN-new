import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import {
  getAdminDashboardController,
  getDoctorDashboardController,
  getNurseDashboardController,
  getPatientDashboardController
} from "./dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.get("/patient", authMiddleware, requireRole("patient"), getPatientDashboardController);
dashboardRoutes.get("/doctor", authMiddleware, requireRole("doctor"), getDoctorDashboardController);
dashboardRoutes.get("/nurse", authMiddleware, requireRole("nurse", "rural_health_officer"), getNurseDashboardController);
dashboardRoutes.get("/admin", authMiddleware, requireRole("super_admin"), getAdminDashboardController);

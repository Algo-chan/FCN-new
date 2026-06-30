import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  getAdminDashboardController,
  getDoctorDashboardController,
  getNurseDashboardController,
  getPatientDashboardController
} from "./dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.get("/patient", authMiddleware, getPatientDashboardController);
dashboardRoutes.get("/doctor", authMiddleware, getDoctorDashboardController);
dashboardRoutes.get("/nurse", authMiddleware, getNurseDashboardController);
dashboardRoutes.get("/admin", authMiddleware, getAdminDashboardController);

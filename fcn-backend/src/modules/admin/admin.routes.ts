import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import {
  getAnalyticsOverviewController,
  getConsultationsTrendController,
  getRegistrationsTrendController,
  getTopDoctorsController,
  getRevenueTrendController,
  getUsersController,
  getUserReviewController,
  approveUserController,
  rejectUserController,
  suspendUserController,
  reactivateUserController,
  createUserController,
  getActivityLogsController,
  getSettingsController,
  updateSettingController,
  manualCleanupController,
  clearAllNotificationsController,
} from "./admin.controller";

export const adminRoutes = Router();

const adminOnly = [authMiddleware, requireRole("super_admin")];

adminRoutes.get("/analytics/overview", ...adminOnly, getAnalyticsOverviewController);
adminRoutes.get("/analytics/consultations", ...adminOnly, getConsultationsTrendController);
adminRoutes.get("/analytics/registrations", ...adminOnly, getRegistrationsTrendController);
adminRoutes.get("/analytics/top-doctors", ...adminOnly, getTopDoctorsController);
adminRoutes.get("/analytics/revenue", ...adminOnly, getRevenueTrendController);

adminRoutes.get("/users", ...adminOnly, getUsersController);
adminRoutes.get("/users/:id/review", ...adminOnly, getUserReviewController);
adminRoutes.patch("/users/:id/approve", ...adminOnly, approveUserController);
adminRoutes.patch("/users/:id/reject", ...adminOnly, rejectUserController);
adminRoutes.patch("/users/:id/suspend", ...adminOnly, suspendUserController);
adminRoutes.patch("/users/:id/reactivate", ...adminOnly, reactivateUserController);
adminRoutes.post("/users", ...adminOnly, createUserController);

adminRoutes.get("/activity-logs", ...adminOnly, getActivityLogsController);

adminRoutes.get("/settings", ...adminOnly, getSettingsController);
adminRoutes.patch("/settings/:key", ...adminOnly, updateSettingController);

adminRoutes.post("/cleanup/messages", ...adminOnly, manualCleanupController);
adminRoutes.post("/cleanup/notifications", ...adminOnly, clearAllNotificationsController);

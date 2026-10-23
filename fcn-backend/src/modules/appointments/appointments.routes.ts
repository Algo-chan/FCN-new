import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import { requireHospitalScope } from "../../middleware/hospital-scope.middleware";
import {
  createAppointmentController,
  getMyAppointmentsController,
  getDoctorAppointmentsController,
  getAppointmentByIdController,
  getAdminAppointmentsController,
  cancelAppointmentController,
  rescheduleAppointmentController,
  startAppointmentController,
  completeAppointmentController,
  rateAppointmentController
} from "./appointments.controller";

export const appointmentRoutes = Router();

appointmentRoutes.post("/", authMiddleware, requireRole("patient"), createAppointmentController);
appointmentRoutes.get("/", authMiddleware, getMyAppointmentsController);
appointmentRoutes.get("/doctor", authMiddleware, requireRole("doctor"), getDoctorAppointmentsController);
appointmentRoutes.get("/admin/all", authMiddleware, requireRole("super_admin", "hospital_admin"), requireHospitalScope, getAdminAppointmentsController);
appointmentRoutes.get("/:id", authMiddleware, getAppointmentByIdController);
appointmentRoutes.post("/:id/rate", authMiddleware, requireRole("patient"), rateAppointmentController);
appointmentRoutes.patch("/:id/cancel", authMiddleware, cancelAppointmentController);
appointmentRoutes.patch("/:id/reschedule", authMiddleware, rescheduleAppointmentController);
appointmentRoutes.patch("/:id/start", authMiddleware, requireRole("doctor"), startAppointmentController);
appointmentRoutes.patch("/:id/complete", authMiddleware, requireRole("doctor"), completeAppointmentController);

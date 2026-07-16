import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import {
  createAppointmentController,
  getMyAppointmentsController,
  getDoctorAppointmentsController,
  getAppointmentByIdController,
  cancelAppointmentController,
  rescheduleAppointmentController,
  startAppointmentController,
  completeAppointmentController
} from "./appointments.controller";

export const appointmentRoutes = Router();

appointmentRoutes.post("/", authMiddleware, requireRole("patient"), createAppointmentController);
appointmentRoutes.get("/", authMiddleware, getMyAppointmentsController);
appointmentRoutes.get("/doctor", authMiddleware, requireRole("doctor"), getDoctorAppointmentsController);
appointmentRoutes.get("/admin/all", authMiddleware, requireRole("super_admin", "hospital_admin"), getAppointmentByIdController);
appointmentRoutes.get("/:id", authMiddleware, getAppointmentByIdController);
appointmentRoutes.patch("/:id/cancel", authMiddleware, cancelAppointmentController);
appointmentRoutes.patch("/:id/reschedule", authMiddleware, rescheduleAppointmentController);
appointmentRoutes.patch("/:id/start", authMiddleware, requireRole("doctor"), startAppointmentController);
appointmentRoutes.patch("/:id/complete", authMiddleware, requireRole("doctor"), completeAppointmentController);

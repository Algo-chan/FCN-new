import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import {
  getMessagesController,
  getConsultationContextController,
  issuePrescriptionController,
  saveSummaryNoteController,
  getConsultationSummaryController
} from "./consultation.controller";

export const consultationRoutes = Router();

consultationRoutes.use(authMiddleware);

consultationRoutes.get("/:appointmentId/messages", getMessagesController);
consultationRoutes.get("/:appointmentId/context", getConsultationContextController);
consultationRoutes.get("/:appointmentId/summary", getConsultationSummaryController);
consultationRoutes.post("/:appointmentId/prescribe", requireRole("doctor"), issuePrescriptionController);
consultationRoutes.post("/:appointmentId/summary-note", requireRole("doctor"), saveSummaryNoteController);

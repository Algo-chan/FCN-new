import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import {
  getMessagesController,
  getConsultationContextController,
  issuePrescriptionController,
  saveSummaryNoteController,
  getConsultationSummaryController,
  requestExtensionController,
  respondExtensionController
} from "./consultation.controller";

export const consultationRoutes = Router();

consultationRoutes.use(authMiddleware);

consultationRoutes.get("/:appointmentId/messages", getMessagesController);
consultationRoutes.get("/:appointmentId/context", getConsultationContextController);
consultationRoutes.get("/:appointmentId/summary", getConsultationSummaryController);
consultationRoutes.post("/:appointmentId/prescribe", requireRole("doctor"), issuePrescriptionController);
consultationRoutes.post("/:appointmentId/summary-note", requireRole("doctor"), saveSummaryNoteController);
consultationRoutes.post("/:appointmentId/extension/request", requireRole("doctor"), requestExtensionController);
consultationRoutes.post("/:appointmentId/extension/respond", requireRole("patient"), respondExtensionController);

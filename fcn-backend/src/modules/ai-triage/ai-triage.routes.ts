import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import {
  startAssessmentController,
  continueConversationController,
  completeAssessmentController,
  getAssessmentHistoryController,
  getAssessmentByIdController,
  getDoctorPatientAssessmentsController,
  markBookingInitiatedController
} from "./ai-triage.controller";

export const aiTriageRoutes = Router();

aiTriageRoutes.post(
  "/start",
  authMiddleware,
  requireRole("patient"),
  startAssessmentController
);

aiTriageRoutes.post(
  "/respond",
  authMiddleware,
  requireRole("patient"),
  continueConversationController
);

aiTriageRoutes.post(
  "/complete",
  authMiddleware,
  requireRole("patient"),
  completeAssessmentController
);

aiTriageRoutes.get(
  "/history",
  authMiddleware,
  requireRole("patient"),
  getAssessmentHistoryController
);

aiTriageRoutes.get(
  "/history/:id",
  authMiddleware,
  getAssessmentByIdController
);

aiTriageRoutes.get(
  "/doctor/patient/:patientId",
  authMiddleware,
  requireRole("doctor"),
  getDoctorPatientAssessmentsController
);

aiTriageRoutes.patch(
  "/booking/:id",
  authMiddleware,
  requireRole("patient"),
  markBookingInitiatedController
);

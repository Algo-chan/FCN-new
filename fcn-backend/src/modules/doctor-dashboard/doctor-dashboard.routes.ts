import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import {
  getDoctorStatsController,
  getDoctorScheduleController,
  getActivePatientsController,
  getPreviousPatientsController,
  getEarningsSummaryController,
  issueFollowUpPrescriptionController,
  saveDoctorNoteController,
  getDoctorNotesController,
} from "./doctor-dashboard.controller";

const router = Router();

const auth = [authMiddleware, requireRole("doctor")];

router.get("/stats", ...auth, getDoctorStatsController);
router.get("/schedule", ...auth, getDoctorScheduleController);
router.get("/active-patients", ...auth, getActivePatientsController);
router.get("/previous-patients", ...auth, getPreviousPatientsController);
router.get("/earnings-summary", ...auth, getEarningsSummaryController);
router.post("/follow-up-prescription", ...auth, issueFollowUpPrescriptionController);
router.post("/doctor-note", ...auth, saveDoctorNoteController);
router.get("/doctor-notes/:patientId", ...auth, getDoctorNotesController);

export const doctorDashboardRoutes = router;

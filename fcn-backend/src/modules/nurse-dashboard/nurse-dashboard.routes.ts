import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import {
  getNurseStatsController,
  getTodayVisitsController,
  getUpcomingVisitsController,
  getVisitPreparationController,
  saveVisitChecklistController,
  updateVisitChecklistController,
  getVisitHistoryController,
} from "./nurse-dashboard.controller";

const router = Router();

const auth = [authMiddleware, requireRole("nurse", "rural_health_officer")];

router.get("/stats", ...auth, getNurseStatsController);
router.get("/today-visits", ...auth, getTodayVisitsController);
router.get("/upcoming-visits", ...auth, getUpcomingVisitsController);
router.get("/visit-preparation/:appointmentId", ...auth, getVisitPreparationController);
router.post("/visit-checklist/:appointmentId", ...auth, saveVisitChecklistController);
router.patch("/visit-checklist/:appointmentId", ...auth, updateVisitChecklistController);
router.get("/visit-history", ...auth, getVisitHistoryController);

export const nurseDashboardRoutes = router;

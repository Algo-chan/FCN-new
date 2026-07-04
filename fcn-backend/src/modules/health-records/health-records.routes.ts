import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import {
  recordVitalsController,
  getVitalsHistoryController,
  getLatestVitalsController,
  getVitalsTrendsController,
  exportVitalsPDFController,
  getNursePatientsController
} from "./health-records.controller";

export const healthRecordsRoutes = Router();

healthRecordsRoutes.use(authMiddleware);

healthRecordsRoutes.post("/vitals", requireRole("patient", "nurse", "doctor"), recordVitalsController);
healthRecordsRoutes.get("/vitals/:patientId", getVitalsHistoryController);
healthRecordsRoutes.get("/vitals/:patientId/latest", getLatestVitalsController);
healthRecordsRoutes.get("/vitals/:patientId/trends", getVitalsTrendsController);
healthRecordsRoutes.get("/vitals/:patientId/export", requireRole("patient", "doctor", "super_admin"), exportVitalsPDFController);
healthRecordsRoutes.get("/nurse/my-patients", requireRole("nurse", "rural_health_officer"), getNursePatientsController);

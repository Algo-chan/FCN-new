import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import { requirePharmacyScope } from "../../middleware/pharmacy-scope.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateRefillRequestSchema,
  RespondToRefillRequestSchema,
  VerifyQRSchema,
  DispensePrescriptionSchema,
  CreatePharmacySchema,
  UpdatePharmacySchema,
  UpdatePharmacyStatusSchema,
  CreatePharmacyAdminSchema,
  LinkPharmacyToHospitalSchema
} from "./pharmacy.validators";
import {
  getMyPrescriptionsController,
  getPrescriptionByIdController,
  getPrescriptionQRController,
  createRefillRequestController,
  getDoctorPrescriptionsController,
  getDoctorRefillRequestsController,
  respondToRefillRequestController,
  verifyQRController,
  dispensePrescriptionController,
  getDispenseHistoryController,
  getPharmaciesController,
  getPharmacyByIdController,
  createPharmacyController,
  updatePharmacyController,
  updatePharmacyStatusController,
  createPharmacyAdminController,
  linkPharmacyToHospitalController,
  unlinkPharmacyFromHospitalController
} from "./pharmacy.controller";

export const pharmacyRoutes = Router();

// Patient-facing prescription routes
pharmacyRoutes.get("/my-prescriptions", authMiddleware, requireRole("patient"), getMyPrescriptionsController);
pharmacyRoutes.get("/my-prescriptions/:id", authMiddleware, getPrescriptionByIdController);
pharmacyRoutes.get("/my-prescriptions/:id/qr", authMiddleware, requireRole("patient"), getPrescriptionQRController);
pharmacyRoutes.post("/refill-request", authMiddleware, requireRole("patient"), validate(CreateRefillRequestSchema), createRefillRequestController);

// Doctor routes
pharmacyRoutes.get("/doctor/prescriptions", authMiddleware, requireRole("doctor"), getDoctorPrescriptionsController);
pharmacyRoutes.get("/doctor/refill-requests", authMiddleware, requireRole("doctor"), getDoctorRefillRequestsController);
pharmacyRoutes.patch("/doctor/refill-requests/:id", authMiddleware, requireRole("doctor"), validate(RespondToRefillRequestSchema), respondToRefillRequestController);

// Pharmacy admin routes (QR verification + dispensing)
pharmacyRoutes.post("/verify-qr", authMiddleware, requireRole("pharmacy_admin", "super_admin"), requirePharmacyScope, validate(VerifyQRSchema), verifyQRController);
pharmacyRoutes.post("/dispense/:prescriptionId", authMiddleware, requireRole("pharmacy_admin", "super_admin"), requirePharmacyScope, validate(DispensePrescriptionSchema), dispensePrescriptionController);
pharmacyRoutes.get("/dispense-history", authMiddleware, requireRole("pharmacy_admin", "super_admin"), requirePharmacyScope, getDispenseHistoryController);

// Pharmacy directory (any authenticated user)
pharmacyRoutes.get("/pharmacies", authMiddleware, getPharmaciesController);
pharmacyRoutes.get("/pharmacies/:id", authMiddleware, getPharmacyByIdController);

// Super admin pharmacy management
pharmacyRoutes.post("/admin/pharmacies", authMiddleware, requireRole("super_admin"), validate(CreatePharmacySchema), createPharmacyController);
pharmacyRoutes.patch("/admin/pharmacies/:id", authMiddleware, requireRole("super_admin"), validate(UpdatePharmacySchema), updatePharmacyController);
pharmacyRoutes.patch("/admin/pharmacies/:id/status", authMiddleware, requireRole("super_admin"), validate(UpdatePharmacyStatusSchema), updatePharmacyStatusController);
pharmacyRoutes.post("/admin/pharmacies/:id/admins", authMiddleware, requireRole("super_admin"), validate(CreatePharmacyAdminSchema), createPharmacyAdminController);
pharmacyRoutes.post("/admin/pharmacies/:id/hospital-links", authMiddleware, requireRole("super_admin"), validate(LinkPharmacyToHospitalSchema), linkPharmacyToHospitalController);
pharmacyRoutes.delete("/admin/pharmacies/:id/hospital-links/:hospitalId", authMiddleware, requireRole("super_admin"), unlinkPharmacyFromHospitalController);

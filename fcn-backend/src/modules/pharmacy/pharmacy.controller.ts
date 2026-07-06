import type { Request, Response, NextFunction } from "express";
import { pharmacyService } from "./pharmacy.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";

export const getMyPrescriptionsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prescriptions = await pharmacyService.getMyPrescriptions(req.user!.id);
    successResponse(res, prescriptions);
  } catch (err) {
    next(err);
  }
};

export const getPrescriptionByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prescription = await pharmacyService.getPrescriptionById(
      req.params.id,
      req.user!.id,
      req.user!.role
    );
    successResponse(res, prescription);
  } catch (err) {
    next(err);
  }
};

export const getPrescriptionQRController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pharmacyService.generateQRCode(req.params.id, req.user!.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const createRefillRequestController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prescription_id, patient_note } = req.body;
    const refillRequest = await pharmacyService.createRefillRequest(
      req.user!.id,
      prescription_id,
      patient_note
    );
    successResponse(res, refillRequest, 201);
  } catch (err) {
    next(err);
  }
};

export const getDoctorPrescriptionsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const prescriptions = await pharmacyService.getDoctorPrescriptions(req.user!.id);
    successResponse(res, prescriptions);
  } catch (err) {
    next(err);
  }
};

export const getDoctorRefillRequestsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requests = await pharmacyService.getDoctorRefillRequests(req.user!.id);
    successResponse(res, requests);
  } catch (err) {
    next(err);
  }
};

export const respondToRefillRequestController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, doctor_note } = req.body;
    const result = await pharmacyService.respondToRefillRequest(
      req.params.id,
      req.user!.id,
      status,
      doctor_note
    );
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const verifyQRController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { qr_hash, rx_reference } = req.body;
    const isRxRef = !!rx_reference;
    const input = isRxRef ? rx_reference : qr_hash;

    const pharmacyId = req.body.pharmacy_id ?? req.scopedPharmacyId;
    if (!pharmacyId) {
      throw new AppError("Pharmacy ID is required", 400, "MISSING_PHARMACY_ID");
    }

    const result = await pharmacyService.verifyQR(
      input,
      isRxRef,
      pharmacyId,
      req.scopedPharmacyId ?? null
    );
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const dispensePrescriptionController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prescription_id, medications_dispensed, notes } = req.body;
    const pharmacyId = req.body.pharmacy_id ?? req.scopedPharmacyId;

    if (!pharmacyId) {
      throw new AppError("Pharmacy ID is required", 400, "MISSING_PHARMACY_ID");
    }

    const result = await pharmacyService.dispensePrescription(
      prescription_id,
      pharmacyId,
      req.user!.id,
      medications_dispensed,
      notes,
      req.scopedPharmacyId ?? null
    );
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const getDispenseHistoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pharmacyId = req.query.pharmacy_id as string ?? req.scopedPharmacyId;
    if (!pharmacyId) {
      throw new AppError("Pharmacy ID is required", 400, "MISSING_PHARMACY_ID");
    }

    const records = await pharmacyService.getDispenseHistory(
      pharmacyId,
      req.scopedPharmacyId ?? null
    );
    successResponse(res, records);
  } catch (err) {
    next(err);
  }
};

export const getPharmaciesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.lat && req.query.lng) {
      filters.near = {
        lat: Number(req.query.lat),
        lng: Number(req.query.lng)
      };
    }

    const pharmacies = await pharmacyService.getPharmacies(filters);
    successResponse(res, pharmacies);
  } catch (err) {
    next(err);
  }
};

export const getPharmacyByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pharmacy = await pharmacyService.getPharmacyById(req.params.id);
    successResponse(res, pharmacy);
  } catch (err) {
    next(err);
  }
};

export const createPharmacyController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pharmacy = await pharmacyService.createPharmacy(req.body);
    successResponse(res, pharmacy, 201);
  } catch (err) {
    next(err);
  }
};

export const updatePharmacyController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pharmacy = await pharmacyService.updatePharmacy(req.params.id, req.body);
    successResponse(res, pharmacy);
  } catch (err) {
    next(err);
  }
};

export const updatePharmacyStatusController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pharmacy = await pharmacyService.updatePharmacyStatus(req.params.id, req.body.status);
    successResponse(res, pharmacy);
  } catch (err) {
    next(err);
  }
};

export const createPharmacyAdminController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await pharmacyService.createPharmacyAdmin(
      req.body,
      req.params.id,
      req.user!.id
    );
    successResponse(res, result, 201);
  } catch (err) {
    next(err);
  }
};

export const linkPharmacyToHospitalController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const link = await pharmacyService.linkPharmacyToHospital(req.params.id, req.body.hospital_id);
    successResponse(res, link, 201);
  } catch (err) {
    next(err);
  }
};

export const unlinkPharmacyFromHospitalController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await pharmacyService.unlinkPharmacyFromHospital(req.params.id, req.params.hospitalId);
    successResponse(res, { message: "Link removed" });
  } catch (err) {
    next(err);
  }
};

import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { healthRecordsService } from "./health-records.service";
import { RecordVitalsSchema, GetVitalsHistorySchema } from "./health-records.validators";
import { z } from "zod";

export const recordVitalsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = RecordVitalsSchema.parse(req.body);
    if (req.user?.role === "patient") {
      body.patient_id = req.user.id;
    }
    const vital = await healthRecordsService.recordVitals(
      req.user!.id,
      req.user!.role,
      body
    );
    successResponse(res, vital, 201);
  } catch (error) {
    next(error);
  }
};

export const getVitalsHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    if (!z.string().uuid().safeParse(patientId).success) {
      throw new AppError("Invalid patient ID", 400, "INVALID_UUID");
    }
    const filters = GetVitalsHistorySchema.parse(req.query);
    const result = await healthRecordsService.getVitalsHistory(
      patientId,
      req.user!.id,
      req.user!.role,
      filters
    );
    successResponse(res, result.data, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getLatestVitalsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const latest = await healthRecordsService.getLatestVitals(
      patientId,
      req.user!.id,
      req.user!.role
    );
    successResponse(res, latest);
  } catch (error) {
    next(error);
  }
};

export const getVitalsTrendsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const trends = await healthRecordsService.getVitalsTrends(
      patientId,
      req.user!.id,
      req.user!.role
    );
    successResponse(res, trends);
  } catch (error) {
    next(error);
  }
};

export const exportVitalsPDFController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { patientId } = req.params;
    const data = await healthRecordsService.generateVitalsPDFData(
      patientId,
      req.user!.id,
      req.user!.role
    );
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getNursePatientsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const patients = await healthRecordsService.getNursePatients(req.user!.id);
    successResponse(res, patients);
  } catch (error) {
    next(error);
  }
};

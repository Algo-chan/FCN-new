import { Request, Response, NextFunction } from "express";
import { doctorDashboardService } from "./doctor-dashboard.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";

export const getDoctorStatsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await doctorDashboardService.getDoctorStats(req.user!.id);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
};

export const getDoctorScheduleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = (req.query.date as string) ?? new Date().toISOString().split("T")[0];
    const view = (req.query.view as "day" | "week") ?? "week";
    const data = await doctorDashboardService.getDoctorSchedule(req.user!.id, date, view);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

export const getActivePatientsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patients = await doctorDashboardService.getActivePatients(req.user!.id);
    successResponse(res, patients);
  } catch (err) {
    next(err);
  }
};

export const getPreviousPatientsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await doctorDashboardService.getPreviousPatients(req.user!.id, page, limit);
    successResponse(res, result.data, 200, result.meta);
  } catch (err) {
    next(err);
  }
};

export const getEarningsSummaryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await doctorDashboardService.getEarningsSummary(req.user!.id);
    successResponse(res, summary);
  } catch (err) {
    next(err);
  }
};

export const issueFollowUpPrescriptionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId, medications } = req.body;
    if (!appointmentId || !medications || !Array.isArray(medications) || medications.length === 0) {
      throw new AppError("appointmentId and medications array are required", 400, "VALIDATION_ERROR");
    }
    const prescription = await doctorDashboardService.issueFollowUpPrescription(req.user!.id, appointmentId, medications);
    successResponse(res, prescription, 201);
  } catch (err) {
    next(err);
  }
};

export const saveDoctorNoteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId, appointmentId, noteText } = req.body;
    if (!patientId || !noteText) {
      throw new AppError("patientId and noteText are required", 400, "VALIDATION_ERROR");
    }
    const note = await doctorDashboardService.saveDoctorNote(req.user!.id, patientId, appointmentId ?? null, noteText);
    successResponse(res, note, 201);
  } catch (err) {
    next(err);
  }
};

export const getDoctorNotesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const notes = await doctorDashboardService.getDoctorNotes(req.user!.id, patientId);
    successResponse(res, notes);
  } catch (err) {
    next(err);
  }
};

import { Request, Response, NextFunction } from "express";
import { nurseDashboardService } from "./nurse-dashboard.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";

export const getNurseStatsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await nurseDashboardService.getNurseStats(req.user!.id);
    successResponse(res, stats);
  } catch (err) {
    next(err);
  }
};

export const getTodayVisitsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visits = await nurseDashboardService.getTodayVisits(req.user!.id);
    successResponse(res, visits);
  } catch (err) {
    next(err);
  }
};

export const getUpcomingVisitsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visits = await nurseDashboardService.getUpcomingVisits(req.user!.id);
    successResponse(res, visits);
  } catch (err) {
    next(err);
  }
};

export const getVisitPreparationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    const data = await nurseDashboardService.getVisitPreparation(req.user!.id, appointmentId);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

export const saveVisitChecklistController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      throw new AppError("items array is required", 400, "VALIDATION_ERROR");
    }
    const checklist = await nurseDashboardService.saveVisitChecklist(req.user!.id, appointmentId, items);
    successResponse(res, checklist, 201);
  } catch (err) {
    next(err);
  }
};

export const updateVisitChecklistController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    const { completedItems, notes } = req.body;
    if (!completedItems || !Array.isArray(completedItems)) {
      throw new AppError("completedItems array is required", 400, "VALIDATION_ERROR");
    }
    const checklist = await nurseDashboardService.updateVisitChecklist(req.user!.id, appointmentId, completedItems, notes);
    successResponse(res, checklist);
  } catch (err) {
    next(err);
  }
};

export const getVisitHistoryController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const visits = await nurseDashboardService.getVisitHistory(req.user!.id);
    successResponse(res, visits);
  } catch (err) {
    next(err);
  }
};

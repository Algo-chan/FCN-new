import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { dashboardService } from "./dashboard.service";

export const getPatientDashboardController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await dashboardService.getPatientDashboard(req.user!.id);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getDoctorDashboardController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await dashboardService.getDoctorDashboard(req.user!.id);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getNurseDashboardController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await dashboardService.getNurseDashboard(req.user!.id);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboardController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await dashboardService.getAdminDashboard();
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

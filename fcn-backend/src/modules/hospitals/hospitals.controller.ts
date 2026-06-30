import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { hospitalsService } from "./hospitals.service";
import {
  CreateHospitalAdminSchema,
  CreateHospitalSchema,
  UpdateHospitalStatusSchema,
  UpdateOccupancySchema
} from "./hospitals.validators";
import { AppError } from "../../utils/app-error";

export const getAllHospitalsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let statusFilter: string | undefined = req.query.status as string | undefined;
    if (req.user?.role !== "super_admin") {
      statusFilter = "active";
    }
    const data = await hospitalsService.getAllHospitals(statusFilter);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getHospitalByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await hospitalsService.getHospitalById(req.params.id);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const updateOccupancyController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = UpdateOccupancySchema.parse(req.body);
    const data = await hospitalsService.updateOccupancy(req.params.id, body, req.user!.id, req.scopedHospitalId ?? null);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const createHospitalController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = CreateHospitalSchema.parse(req.body);
    const data = await hospitalsService.createHospital(body);
    successResponse(res, data, 201);
  } catch (error) {
    next(error);
  }
};

export const updateHospitalController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = CreateHospitalSchema.parse(req.body);
    const data = await hospitalsService.updateHospital(req.params.id, body);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const updateHospitalStatusController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = UpdateHospitalStatusSchema.parse(req.body);
    const data = await hospitalsService.updateHospitalStatus(req.params.id, body.status);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getHospitalAdminsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await hospitalsService.getHospitalAdmins(req.params.id);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const createHospitalAdminController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = CreateHospitalAdminSchema.parse(req.body);
    const data = await hospitalsService.createHospitalAdmin(body, req.user!.id);
    successResponse(res, data, 201);
  } catch (error) {
    next(error);
  }
};

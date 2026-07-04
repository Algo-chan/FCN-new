import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { doctorsService } from "./doctors.service";
import {
  GetDoctorsQuerySchema,
  UpdateAvailabilityStatusSchema,
  UpdateDoctorProfileSchema
} from "./doctors.validators";

export const getAllDoctorsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = GetDoctorsQuerySchema.parse(req.query);
    const result = await doctorsService.getAllDoctors(query, req.user!.id);
    successResponse(res, result.doctors, 200, {
      page: result.page,
      limit: query.limit,
      total: result.total,
      totalPages: result.totalPages
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableSpecialtiesController = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await doctorsService.getAvailableSpecialties();
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getDoctorByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await doctorsService.getDoctorById(req.params.id);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getDoctorAvailabilityController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const date = req.query.date as string | undefined;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new AppError("A valid date parameter (YYYY-MM-DD) is required", 400, "INVALID_DATE");
    }
    const data = await doctorsService.getDoctorAvailability(req.params.id, date);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const updateAvailabilityStatusController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = UpdateAvailabilityStatusSchema.parse(req.body);
    await doctorsService.updateAvailabilityStatus(req.user!.id, body.availability_status);
    successResponse(res, { message: "Availability status updated" });
  } catch (error) {
    next(error);
  }
};

export const updateDoctorProfileController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = UpdateDoctorProfileSchema.parse(req.body);
    await doctorsService.updateDoctorProfile(req.user!.id, body);
    successResponse(res, { message: "Profile updated" });
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePhotoController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError("No photo file provided", 400, "FILE_REQUIRED");
    }
    const result = await doctorsService.uploadProfilePhoto(req.user!.id, req.file.buffer, req.file.mimetype);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const deleteProfilePhotoController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await doctorsService.deleteProfilePhoto(req.user!.id);
    successResponse(res, { message: "Profile photo removed" });
  } catch (error) {
    next(error);
  }
};

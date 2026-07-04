import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { appointmentsService } from "./appointments.service";
import {
  CreateAppointmentSchema,
  CancelAppointmentSchema,
  RescheduleAppointmentSchema,
  GetAppointmentsQuerySchema
} from "./appointments.validators";

export const createAppointmentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = CreateAppointmentSchema.parse({ body: req.body }).body;
    const result = await appointmentsService.createAppointment(req.user!.id, body);
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyAppointmentsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = GetAppointmentsQuerySchema.parse({ query: req.query }).query;
    const result = await appointmentsService.getPatientAppointments(req.user!.id, query.status, query.page, query.limit);
    successResponse(res, result.appointments, 200, {
      page: result.page,
      limit: query.limit,
      total: result.total,
      totalPages: result.totalPages
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorAppointmentsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = GetAppointmentsQuerySchema.parse({ query: req.query }).query;
    const result = await appointmentsService.getDoctorAppointments(req.user!.id, query.status, query.page, query.limit);
    successResponse(res, result.appointments, 200, {
      page: result.page,
      limit: query.limit,
      total: result.total,
      totalPages: result.totalPages
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.params.id || typeof req.params.id !== "string") {
      throw new AppError("Appointment ID is required", 400, "ID_REQUIRED");
    }
    const result = await appointmentsService.getAppointmentById(req.params.id);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const cancelAppointmentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.params.id || typeof req.params.id !== "string") {
      throw new AppError("Appointment ID is required", 400, "ID_REQUIRED");
    }
    const body = CancelAppointmentSchema.parse({ body: req.body }).body;
    await appointmentsService.cancelAppointment(req.params.id, req.user!.id, req.user!.role, body.reason);
    successResponse(res, { message: "Appointment cancelled" });
  } catch (error) {
    next(error);
  }
};

export const rescheduleAppointmentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.params.id || typeof req.params.id !== "string") {
      throw new AppError("Appointment ID is required", 400, "ID_REQUIRED");
    }
    const body = RescheduleAppointmentSchema.parse({ body: req.body }).body;
    const result = await appointmentsService.rescheduleAppointment(req.params.id, req.user!.id, req.user!.role, body);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const startAppointmentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.params.id || typeof req.params.id !== "string") {
      throw new AppError("Appointment ID is required", 400, "ID_REQUIRED");
    }
    await appointmentsService.startAppointment(req.params.id, req.user!.id);
    successResponse(res, { message: "Appointment started" });
  } catch (error) {
    next(error);
  }
};

export const completeAppointmentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.params.id || typeof req.params.id !== "string") {
      throw new AppError("Appointment ID is required", 400, "ID_REQUIRED");
    }
    await appointmentsService.completeAppointment(req.params.id, req.user!.id);
    successResponse(res, { message: "Appointment completed" });
  } catch (error) {
    next(error);
  }
};

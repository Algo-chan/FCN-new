import type { Request, Response, NextFunction } from "express";
import { instantConsultService } from "./instant-consult.service";
import { successResponse } from "../../utils/response";

export class InstantConsultController {
  async requestInstantConsult(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = req.user!.id;
      const { chief_complaint, allergies } = req.body;
      const result = await instantConsultService.requestInstantConsult(
        patientId,
        chief_complaint,
        allergies
      );
      return successResponse(res, result);
    } catch (error) {
      return next(error);
    }
  }

  async acceptInstantConsult(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user!.id;
      const { appointment_id } = req.body;
      const result = await instantConsultService.acceptInstantConsult(doctorId, appointment_id);
      return successResponse(res, result);
    } catch (error) {
      return next(error);
    }
  }

  async declineInstantConsult(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.user!.id;
      const { appointment_id } = req.body;
      const result = await instantConsultService.declineInstantConsult(doctorId, appointment_id);
      return successResponse(res, result);
    } catch (error) {
      return next(error);
    }
  }

  async cancelInstantConsult(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = req.user!.id;
      const { appointment_id } = req.body;
      const result = await instantConsultService.cancelInstantConsult(patientId, appointment_id);
      return successResponse(res, result);
    } catch (error) {
      return next(error);
    }
  }

  async getQueueStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const patientId = req.user!.id;
      const result = instantConsultService.getQueueStatus(patientId);
      return successResponse(res, result);
    } catch (error) {
      return next(error);
    }
  }
}

export const instantConsultController = new InstantConsultController();

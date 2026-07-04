import type { NextFunction, Request, Response } from "express";
import { consultationService } from "./consultation.service";
import { IssuePrescriptionSchema, SaveSummaryNoteSchema } from "./consultation.validators";
import { successResponse, errorResponse } from "../../utils/response";
import { getIO } from "../../socket";
import { logger } from "../../utils/logger";
import { prisma } from "../../config/database";

export const getMessagesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const result = await consultationService.getMessages(appointmentId, req.user!.id, page, limit);
    successResponse(res, result.messages, 200, result.meta);
  } catch (error) {
    next(error);
  }
};

export const getConsultationContextController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const context = await consultationService.getConsultationContext(
      appointmentId,
      req.user!.id,
      req.user!.role
    );
    successResponse(res, context);
  } catch (error) {
    next(error);
  }
};

export const issuePrescriptionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const body = IssuePrescriptionSchema.parse(req.body);

    const prescription = await consultationService.issuePrescription(
      appointmentId,
      req.user!.id,
      body
    );

    const doctor = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { full_name: true }
    });

    try {
      const io = getIO();
      io.to(`consultation:${appointmentId}`).emit("prescription_issued", {
        prescriptionId: prescription!.id,
        rx_reference: prescription!.rx_reference,
        medications: prescription!.medications,
        issued_by: doctor?.full_name ?? "Doctor"
      });
    } catch (err) {
      logger.error("Failed to emit prescription_issued socket event", { error: err });
    }

    successResponse(res, prescription, 201);
  } catch (error) {
    next(error);
  }
};

export const saveSummaryNoteController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const body = SaveSummaryNoteSchema.parse(req.body);
    await consultationService.saveSummaryNote(appointmentId, req.user!.id, body.note);
    successResponse(res, { saved: true });
  } catch (error) {
    next(error);
  }
};

export const getConsultationSummaryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { appointmentId } = req.params;
    const summary = await consultationService.getSummary(appointmentId, req.user!.id);
    successResponse(res, summary);
  } catch (error) {
    next(error);
  }
};

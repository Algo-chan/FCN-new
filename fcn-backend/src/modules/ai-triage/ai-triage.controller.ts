import type { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/response";
import { aiTriageService } from "./ai-triage.service";
import {
  StartAssessmentSchema,
  ContinueConversationSchema,
  CompleteAssessmentSchema,
  HistoryQuerySchema
} from "./ai-triage.validators";

export const startAssessmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = StartAssessmentSchema.parse(req.body);
    const result = await aiTriageService.startAssessment(
      req.user!.id,
      body.language,
      body.initial_symptoms
    );
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const continueConversationController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = ContinueConversationSchema.parse(req.body);
    const result = await aiTriageService.continueConversation(
      body.assessment_id,
      req.user!.id,
      body.patient_message
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const completeAssessmentController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = CompleteAssessmentSchema.parse(req.body);
    const result = await aiTriageService.completeAssessment(
      body.assessment_id,
      req.user!.id
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const query = HistoryQuerySchema.parse(req.query);
    const result = await aiTriageService.getAssessmentHistory(
      req.user!.id,
      query.page,
      query.limit
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await aiTriageService.getAssessmentById(
      req.params.id,
      req.user!.id,
      req.user!.role
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const getDoctorPatientAssessmentsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await aiTriageService.getDoctorPatientAssessments(
      req.user!.id,
      req.params.patientId
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const markBookingInitiatedController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await aiTriageService.markBookingInitiated(
      req.params.id,
      req.user!.id
    );
    successResponse(res, { booking_initiated: true });
  } catch (error) {
    next(error);
  }
};

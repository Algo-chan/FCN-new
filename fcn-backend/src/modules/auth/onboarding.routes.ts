import { Router, type NextFunction, type Request, type Response } from "express";
import { prisma } from "../../config/database";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { OnboardingStep1Schema, OnboardingStep2Schema, OnboardingStep3Schema } from "./auth.validators";

export const onboardingRoutes = Router();

const currentStep = (profile: { date_of_birth: Date | null; chronic_conditions: string[]; known_allergies: string | null; home_address: string | null; onboarding_completed: boolean }): 1 | 2 | 3 => {
  if (profile.onboarding_completed) {
    return 3;
  }
  if (!profile.date_of_birth) {
    return 1;
  }
  if (!profile.chronic_conditions.length && !profile.known_allergies) {
    return 2;
  }
  return 3;
};

onboardingRoutes.post(
  "/patient/step1",
  authMiddleware,
  requireRole("patient"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = OnboardingStep1Schema.parse(req.body);
      await prisma.patientProfile.update({
        where: { user_id: req.user!.id },
        data
      });
      successResponse(res, { saved: true });
    } catch (error) {
      next(error);
    }
  }
);

onboardingRoutes.post(
  "/patient/step2",
  authMiddleware,
  requireRole("patient"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = OnboardingStep2Schema.parse(req.body);
      await prisma.patientProfile.update({
        where: { user_id: req.user!.id },
        data
      });
      successResponse(res, { saved: true });
    } catch (error) {
      next(error);
    }
  }
);

onboardingRoutes.post(
  "/patient/step3",
  authMiddleware,
  requireRole("patient"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = OnboardingStep3Schema.parse(req.body);
      await prisma.patientProfile.update({
        where: { user_id: req.user!.id },
        data: {
          ...data,
          onboarding_completed: true
        }
      });
      successResponse(res, { completed: true });
    } catch (error) {
      next(error);
    }
  }
);

onboardingRoutes.get(
  "/patient/status",
  authMiddleware,
  requireRole("patient"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await prisma.patientProfile.findUnique({ where: { user_id: req.user!.id } });
      if (!profile) {
        throw new AppError("Patient profile not found", 404, "NOT_FOUND");
      }
      successResponse(res, {
        completed: profile.onboarding_completed,
        current_step: currentStep(profile)
      });
    } catch (error) {
      next(error);
    }
  }
);

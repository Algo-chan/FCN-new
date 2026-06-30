import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/database";
import { errorResponse } from "../utils/response";

declare global {
  namespace Express {
    interface Request {
      scopedHospitalId?: string | null;
    }
  }
}

export const requireHospitalScope = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    errorResponse(res, "Authentication is required", 401, "UNAUTHORIZED");
    return;
  }

  if (req.user.role === "super_admin") {
    req.scopedHospitalId = null;
    next();
    return;
  }

  if (req.user.role === "hospital_admin") {
    try {
      const profile = await prisma.hospitalAdminProfile.findUnique({
        where: { user_id: req.user.id }
      });

      if (!profile) {
        errorResponse(res, "Hospital admin profile not found", 403, "FORBIDDEN");
        return;
      }

      req.scopedHospitalId = profile.hospital_id;
      next();
      return;
    } catch {
      errorResponse(res, "Failed to verify hospital scope", 500, "INTERNAL_ERROR");
      return;
    }
  }

  errorResponse(res, "You do not have permission to access this resource", 403, "FORBIDDEN");
};

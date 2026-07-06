import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/database";
import { errorResponse } from "../utils/response";

declare global {
  namespace Express {
    interface Request {
      scopedPharmacyId?: string | null;
    }
  }
}

export const requirePharmacyScope = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    errorResponse(res, "Authentication is required", 401, "UNAUTHORIZED");
    return;
  }

  if (req.user.role === "super_admin") {
    req.scopedPharmacyId = null;
    next();
    return;
  }

  if (req.user.role === "pharmacy_admin") {
    try {
      const profile = await prisma.pharmacyAdminProfile.findUnique({
        where: { user_id: req.user.id }
      });

      if (!profile) {
        errorResponse(res, "Pharmacy admin profile not found", 403, "FORBIDDEN");
        return;
      }

      req.scopedPharmacyId = profile.pharmacy_id;
      next();
      return;
    } catch {
      errorResponse(res, "Failed to verify pharmacy scope", 500, "INTERNAL_ERROR");
      return;
    }
  }

  errorResponse(res, "You do not have permission to access this resource", 403, "FORBIDDEN");
};

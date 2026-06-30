import type { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/response";

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, "Authentication is required", 401, "UNAUTHORIZED");
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(res, "You do not have permission to access this resource", 403, "FORBIDDEN");
      return;
    }

    next();
  };

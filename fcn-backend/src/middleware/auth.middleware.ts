import type { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/response";
import { verifyAccessToken } from "../utils/jwt";

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authorization = req.header("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    errorResponse(res, "Authentication token is required", 401, "UNAUTHORIZED");
    return;
  }

  try {
    const decoded = verifyAccessToken(token);

    if (decoded.status === "suspended" || decoded.status === "rejected") {
      errorResponse(res, "User account is not active", 403, "ACCOUNT_INACTIVE");
      return;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      status: decoded.status
    };

    next();
  } catch {
    errorResponse(res, "Invalid or expired authentication token", 401, "INVALID_TOKEN");
  }
};

import type { NextFunction, Request, Response } from "express";
import { isFeatureEnabled, type FeatureFlag } from "../utils/feature-flags";
import { errorResponse } from "../utils/response";

export const requireFeature = (flag: FeatureFlag) => {
  return (_req: Request, res: Response, next: NextFunction): void => {
    if (!isFeatureEnabled(flag)) {
      errorResponse(res, "Not found", 404, "NOT_FOUND");
      return;
    }
    next();
  };
};
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import { systemSettings } from "../../utils/system-settings";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { z } from "zod";
import type { NextFunction, Request, Response } from "express";

export const settingsRoutes = Router();

const UpdateSettingSchema = z.object({
  value: z.string().min(1),
  description: z.string().optional()
});

settingsRoutes.get("/", authMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await systemSettings.getAll();
    successResponse(res, settings);
  } catch (error) {
    next(error);
  }
});

settingsRoutes.patch("/:key", authMiddleware, requireRole("super_admin"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    if (!key) throw new AppError("Setting key is required", 400, "KEY_REQUIRED");

    const body = UpdateSettingSchema.parse(req.body);
    await systemSettings.set(key, body.value, body.description);
    successResponse(res, { message: "Setting updated" });
  } catch (error) {
    next(error);
  }
});

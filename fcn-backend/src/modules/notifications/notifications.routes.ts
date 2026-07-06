import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import { validate } from "../../middleware/validate.middleware";
import { z } from "zod";
import {
  getNotificationsController,
  getUnreadCountController,
  markAllReadController,
  markOneReadController,
  clearAllReadController,
  saveFCMTokenController,
  sendTestNotificationController
} from "./notifications.controller";

export const notificationsRoutes = Router();

const SaveFCMTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1)
  })
});

notificationsRoutes.get("/", authMiddleware, getNotificationsController);
notificationsRoutes.get("/unread-count", authMiddleware, getUnreadCountController);
notificationsRoutes.patch("/mark-read", authMiddleware, markAllReadController);
notificationsRoutes.patch("/:id/read", authMiddleware, markOneReadController);
notificationsRoutes.delete("/clear-all", authMiddleware, clearAllReadController);
notificationsRoutes.post("/fcm-token", authMiddleware, validate(SaveFCMTokenSchema), saveFCMTokenController);
notificationsRoutes.post("/test", authMiddleware, requireRole("super_admin"), sendTestNotificationController);

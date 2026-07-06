import type { Request, Response, NextFunction } from "express";
import { notificationsQueryService } from "./notifications.service";
import { notificationService } from "./notification.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";

export const getNotificationsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const group = req.query.group as string | undefined;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);

    const result = await notificationsQueryService.getNotifications(req.user!.id, group, page, limit);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const getUnreadCountController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await notificationsQueryService.getUnreadCount(req.user!.id);
    successResponse(res, { count });
  } catch (err) {
    next(err);
  }
};

export const markAllReadController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationsQueryService.markAllRead(req.user!.id);
    successResponse(res, { message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

export const markOneReadController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationsQueryService.markOneRead(req.params.id, req.user!.id);
    successResponse(res, { message: "Notification marked as read" });
  } catch (err) {
    next(err);
  }
};

export const clearAllReadController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationsQueryService.clearAllRead(req.user!.id);
    successResponse(res, { message: "Read notifications cleared" });
  } catch (err) {
    next(err);
  }
};

export const saveFCMTokenController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      throw new AppError("FCM token is required", 400, "MISSING_TOKEN");
    }

    await notificationsQueryService.saveFCMToken(req.user!.id, token);
    successResponse(res, { message: "FCM token saved" });
  } catch (err) {
    next(err);
  }
};

export const sendTestNotificationController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.send({
      userId: req.user!.id,
      type: "welcome",
      title: "\u{1F3E5} Test Notification",
      message: "This is a test notification from the FCN admin panel.",
      actionUrl: "/notifications",
      channels: ["in_app", "fcm"],
      priority: "high"
    });

    successResponse(res, { message: "Test notification sent" });
  } catch (err) {
    next(err);
  }
};

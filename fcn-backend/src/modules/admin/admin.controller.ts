import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";

const getIp = (req: Request): string => {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
};

export const getAnalyticsOverviewController = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = await adminService.getAnalyticsOverview();
    successResponse(res, overview);
  } catch (err) {
    next(err);
  }
};

export const getConsultationsTrendController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await adminService.getConsultationsTrend(days);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

export const getRegistrationsTrendController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const data = await adminService.getRegistrationsTrend(weeks);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

export const getTopDoctorsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await adminService.getTopDoctors(limit);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

export const getRevenueTrendController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const data = await adminService.getRevenueTrend(months);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

export const getUsersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, status, search, page = "1", limit = "20" } = req.query;
    const data = await adminService.getUsers({
      role: role as string | undefined,
      status: status as string | undefined,
      search: search as string | undefined,
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 100),
    });
    successResponse(res, data.users, 200, { page: data.page, limit: data.limit, total: data.total });
  } catch (err) {
    next(err);
  }
};

export const getUserReviewController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await adminService.getUserReview(id);
    successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

export const approveUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;
    const ipAddress = getIp(req);
    await adminService.approveUser(id, adminId, ipAddress);
    successResponse(res, { message: "User approved successfully" });
  } catch (err) {
    next(err);
  }
};

export const rejectUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || reason.trim().length < 20) {
      throw new AppError("Rejection reason must be at least 20 characters", 400);
    }
    const adminId = req.user!.id;
    const ipAddress = getIp(req);
    await adminService.rejectUser(id, reason, adminId, ipAddress);
    successResponse(res, { message: "User rejected" });
  } catch (err) {
    next(err);
  }
};

export const suspendUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason || reason.trim().length < 5) {
      throw new AppError("Suspension reason is required (min 5 characters)", 400);
    }
    const adminId = req.user!.id;
    const ipAddress = getIp(req);
    await adminService.suspendUser(id, reason, adminId, ipAddress);
    successResponse(res, { message: "User suspended" });
  } catch (err) {
    next(err);
  }
};

export const reactivateUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;
    const ipAddress = getIp(req);
    await adminService.reactivateUser(id, adminId, ipAddress);
    successResponse(res, { message: "User reactivated" });
  } catch (err) {
    next(err);
  }
};

export const createUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { full_name, email, phone, password, role } = req.body;
    if (!full_name || !email || !password || !role) {
      throw new AppError("Missing required fields: full_name, email, password, role", 400);
    }
    const { prisma } = await import("../../config/database");
    const { hashPassword } = await import("../../utils/bcrypt");

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        full_name,
        email,
        phone: phone || null,
        password_hash: hashedPassword,
        role,
        status: role === "patient" ? "active" : "pending",
      },
    });

    const adminId = req.user!.id;
    const ipAddress = getIp(req);
    const { logActivity } = await import("../../utils/activity-logger");

    await logActivity({
      actorId: adminId,
      actorRole: "super_admin",
      action: `CREATE_USER_${role.toUpperCase()}`,
      targetType: "User",
      targetId: user.id,
      targetName: user.full_name,
      ipAddress,
    });

    successResponse(res, { id: user.id, full_name: user.full_name, email: user.email, role: user.role, status: user.status });
  } catch (err) {
    next(err);
  }
};

export const getActivityLogsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, actorId, targetType, fromDate, toDate, page = "1", limit = "50" } = req.query;
    const data = await adminService.getActivityLogs({
      action: action as string | undefined,
      actorId: actorId as string | undefined,
      targetType: targetType as string | undefined,
      fromDate: fromDate as string | undefined,
      toDate: toDate as string | undefined,
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string), 200),
    });
    successResponse(res, data.logs, 200, { page: data.page, limit: data.limit, total: data.total });
  } catch (err) {
    next(err);
  }
};

export const getSettingsController = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await adminService.getSettings();
    successResponse(res, settings);
  } catch (err) {
    next(err);
  }
};

export const updateSettingController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined || value === null) {
      throw new AppError("Value is required", 400);
    }
    const adminId = req.user!.id;
    const ipAddress = getIp(req);
    await adminService.updateSetting(key, String(value), adminId, ipAddress);
    successResponse(res, { message: "Setting updated" });
  } catch (err) {
    next(err);
  }
};

export const manualCleanupController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;
    const ipAddress = getIp(req);
    const count = await adminService.manualCleanup(adminId, ipAddress);
    successResponse(res, { deleted_count: count });
  } catch (err) {
    next(err);
  }
};

export const clearAllNotificationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user!.id;
    const ipAddress = getIp(req);
    const count = await adminService.clearAllNotifications(adminId, ipAddress);
    successResponse(res, { deleted_count: count });
  } catch (err) {
    next(err);
  }
};

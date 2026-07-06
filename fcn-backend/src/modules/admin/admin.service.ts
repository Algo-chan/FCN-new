import { prisma } from "../../config/database";
import { systemSettings } from "../../utils/system-settings";
import { logActivity } from "../../utils/activity-logger";
import { emailService } from "../auth/email.service";
import { notificationService } from "../notifications/notification.service";
import { ACTIVITY_ACTIONS } from "../../constants/activity-actions";
import { redis } from "../../config/redis";
import { logger } from "../../utils/logger";
import { MASTER_SPECIALTIES } from "../../constants/specialties";

interface PaginationParams {
  page: number;
  limit: number;
}

interface GetUsersFilters extends PaginationParams {
  role?: string;
  status?: string;
  search?: string;
}

interface GetActivityLogsFilters extends PaginationParams {
  action?: string;
  actorId?: string;
  targetType?: string;
  fromDate?: string;
  toDate?: string;
}

interface Overview {
  total_users: number;
  total_users_growth: number;
  total_doctors: number;
  total_patients: number;
  total_appointments: number;
  appointments_today: number;
  appointments_this_week: number;
  completed_consultations: number;
  completion_rate: number;
  pending_approvals: number;
  active_hospitals: number;
  active_pharmacies: number;
  total_prescriptions: number;
  revenue_this_month: number;
  revenue_total: number;
}

interface TrendPoint {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

interface RegistrationTrendPoint {
  week: string;
  patients: number;
  doctors: number;
  nurses: number;
  total: number;
}

interface TopDoctor {
  doctor_id: string;
  full_name: string;
  specialty: string;
  hospital_name: string | null;
  photo_url: string | null;
  total_consultations: number;
  completed_consultations: number;
  rating_average: number;
  rating_count: number;
  revenue_generated: number;
}

interface RevenueTrendPoint {
  month: string;
  revenue: number;
  consultations_paid: number;
  average_fee: number;
}

interface PaginatedUsers {
  users: any[];
  page: number;
  limit: number;
  total: number;
}

interface UserReviewData {
  user: any;
  profile: any;
  hospital: any | null;
  appointments_count: number;
  registration_date: string;
  license_verification_status: string;
  specialty_valid: boolean;
  flags: string[];
}

interface PaginatedActivityLogs {
  logs: any[];
  page: number;
  limit: number;
  total: number;
}

export class AdminService {
  async getAnalyticsOverview(): Promise<Overview> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalUsers,
      totalUsersLastMonth,
      totalDoctors,
      totalPatients,
      totalAppointments,
      appointmentsToday,
      appointmentsThisWeek,
      completedConsultations,
      pendingApprovals,
      activeHospitals,
      activePharmacies,
      totalPrescriptions,
      revenueThisMonth,
      revenueTotal,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { created_at: { lt: lastMonthStart } } }),
      prisma.user.count({ where: { role: "doctor", status: "active" } }),
      prisma.user.count({ where: { role: "patient", status: "active" } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { scheduled_at: { gte: startOfToday } } }),
      prisma.appointment.count({ where: { scheduled_at: { gte: startOfWeek } } }),
      prisma.appointment.count({ where: { status: "completed" } }),
      prisma.user.count({ where: { status: "pending", role: { in: ["doctor", "nurse"] } } }),
      prisma.hospital.count({ where: { status: "active" } }),
      prisma.pharmacy.count({ where: { status: "ACTIVE" as any } }),
      prisma.prescription.count(),
      prisma.appointment.aggregate({
        _sum: { platform_fee_etb: true },
        where: { payment_status: "paid", created_at: { gte: startOfMonth } },
      }),
      prisma.appointment.aggregate({
        _sum: { platform_fee_etb: true },
        where: { payment_status: "paid" },
      }),
    ]);

    const totalUsersGrowth = totalUsersLastMonth > 0
      ? Math.round(((totalUsers - totalUsersLastMonth) / totalUsersLastMonth) * 100)
      : 0;

    const completionRate = totalAppointments > 0
      ? Math.round((completedConsultations / totalAppointments) * 100)
      : 0;

    const revenueThisMonthVal = Number(revenueThisMonth._sum.platform_fee_etb ?? 0);
    const revenueTotalVal = Number(revenueTotal._sum.platform_fee_etb ?? 0);

    return {
      total_users: totalUsers,
      total_users_growth: totalUsersGrowth,
      total_doctors: totalDoctors,
      total_patients: totalPatients,
      total_appointments: totalAppointments,
      appointments_today: appointmentsToday,
      appointments_this_week: appointmentsThisWeek,
      completed_consultations: completedConsultations,
      completion_rate: completionRate,
      pending_approvals: pendingApprovals,
      active_hospitals: activeHospitals,
      active_pharmacies: activePharmacies,
      total_prescriptions: totalPrescriptions,
      revenue_this_month: revenueThisMonthVal,
      revenue_total: revenueTotalVal,
    };
  }

  async getConsultationsTrend(days: number = 30): Promise<TrendPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: { created_at: { gte: startDate } },
      select: { created_at: true, status: true },
      orderBy: { created_at: "asc" },
    });

    const grouped = new Map<string, { total: number; completed: number; cancelled: number }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split("T")[0];
      grouped.set(key, { total: 0, completed: 0, cancelled: 0 });
    }

    for (const appt of appointments) {
      const key = appt.created_at.toISOString().split("T")[0];
      const entry = grouped.get(key);
      if (entry) {
        entry.total++;
        if (appt.status === "completed") entry.completed++;
        if (appt.status === "cancelled") entry.cancelled++;
      }
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Array.from(grouped.entries()).map(([dateStr, data]) => {
      const d = new Date(dateStr);
      return {
        date: `${monthNames[d.getMonth()]} ${d.getDate()}`,
        total: data.total,
        completed: data.completed,
        cancelled: data.cancelled,
      };
    });
  }

  async getRegistrationsTrend(weeks: number = 12): Promise<RegistrationTrendPoint[]> {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - weeks * 7);
    startDate.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: { created_at: { gte: startDate } },
      select: { created_at: true, role: true },
      orderBy: { created_at: "asc" },
    });

    const weekData = new Map<string, { patients: number; doctors: number; nurses: number; total: number }>();

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const key = weekStart.toISOString().split("T")[0];
      weekData.set(key, { patients: 0, doctors: 0, nurses: 0, total: 0 });
    }

    for (const user of users) {
      const diffDays = Math.floor((user.created_at.getTime() - startDate.getTime()) / (86400000));
      const weekIndex = Math.floor(diffDays / 7);
      if (weekIndex >= 0 && weekIndex < weeks) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + weekIndex * 7);
        const key = weekStart.toISOString().split("T")[0];
        const entry = weekData.get(key);
        if (entry) {
          entry.total++;
          if (user.role === "patient") entry.patients++;
          else if (user.role === "doctor") entry.doctors++;
          else if (user.role === "nurse") entry.nurses++;
        }
      }
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Array.from(weekData.entries()).map(([dateStr, data]) => {
      const d = new Date(dateStr);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return {
        week: `${monthNames[d.getMonth()]} ${d.getDate()}`,
        patients: data.patients,
        doctors: data.doctors,
        nurses: data.nurses,
        total: data.total,
      };
    });
  }

  async getTopDoctors(limit: number = 10): Promise<TopDoctor[]> {
    const doctors = await prisma.doctorProfile.findMany({
      take: limit,
      orderBy: { rating_count: "desc" },
      include: {
        user: { select: { full_name: true } },
        hospital: { select: { name: true } },
      },
    });

    const results: TopDoctor[] = [];

    for (const doc of doctors) {
      const completedAppts = await prisma.appointment.count({
        where: { doctor_id: doc.user_id, status: "completed" },
      });

      const totalAppts = await prisma.appointment.count({
        where: { doctor_id: doc.user_id },
      });

      const revenue = await prisma.appointment.aggregate({
        _sum: { platform_fee_etb: true },
        where: { doctor_id: doc.user_id, payment_status: "paid" },
      });

      results.push({
        doctor_id: doc.user_id,
        full_name: doc.user.full_name,
        specialty: doc.specialty,
        hospital_name: doc.hospital?.name ?? null,
        photo_url: doc.photo_url,
        total_consultations: totalAppts,
        completed_consultations: completedAppts,
        rating_average: Number(doc.rating_average),
        rating_count: doc.rating_count,
        revenue_generated: Number(revenue._sum.platform_fee_etb ?? 0),
      });
    }

    results.sort((a, b) => b.completed_consultations - a.completed_consultations);
    return results.slice(0, limit);
  }

  async getRevenueTrend(months: number = 6): Promise<RevenueTrendPoint[]> {
    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const results: RevenueTrendPoint[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

      const paidAppts = await prisma.appointment.findMany({
        where: {
          payment_status: "paid",
          created_at: { gte: monthStart, lte: monthEnd },
        },
        select: { platform_fee_etb: true },
      });

      const revenue = paidAppts.reduce((sum, a) => sum + Number(a.platform_fee_etb), 0);
      const consultationCount = paidAppts.length;

      results.push({
        month: `${monthNames[monthStart.getMonth()]} ${monthStart.getFullYear()}`,
        revenue,
        consultations_paid: consultationCount,
        average_fee: consultationCount > 0 ? Math.round(revenue / consultationCount) : 0,
      });
    }

    return results;
  }

  async getUsers(filters: GetUsersFilters): Promise<PaginatedUsers> {
    const { role, status, search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role && role !== "all") where.role = role;
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          doctor_profile: { select: { specialty: true, license_number: true, photo_url: true } },
          nurse_profile: { select: { license_number: true, coverage_zone: true } },
          patient_profile: { select: { date_of_birth: true } },
        },
        orderBy: [{ status: "asc" }, { created_at: "desc" }],
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, page, limit, total };
  }

  async getUserReview(userId: string): Promise<UserReviewData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        doctor_profile: { include: { hospital: true } },
        nurse_profile: true,
        patient_profile: true,
      },
    });

    if (!user) throw new Error("User not found");

    const appointmentsCount = await prisma.appointment.count({
      where: { doctor_id: userId },
    });

    const flags: string[] = [];
    let licenseVerificationStatus = "pending";
    let specialtyValid = false;

    if (user.role === "doctor" && user.doctor_profile) {
      const dp = user.doctor_profile;
      const licenseRegex = /^[A-Z]{2}\d{4,8}$/;
      if (!licenseRegex.test(dp.license_number)) {
        flags.push("License number format appears invalid");
        licenseVerificationStatus = "invalid";
      } else {
        licenseVerificationStatus = "valid";
      }

      specialtyValid = (MASTER_SPECIALTIES as readonly string[]).includes(dp.specialty);
      if (!specialtyValid) {
        flags.push(`Unknown specialty "${dp.specialty}" — verify manually`);
      }

      if (dp.hospital) {
        const hospitalRegistered = await prisma.hospital.findUnique({
          where: { id: dp.hospital_id ?? undefined },
        });
        if (!hospitalRegistered || hospitalRegistered.status !== "active") {
          flags.push("Hospital not found in FCN database");
        }
      } else {
        flags.push("No hospital affiliation provided");
      }

      if (!dp.bio) {
        flags.push("No professional bio provided");
      }
    }

    if (user.role === "nurse" && user.nurse_profile) {
      const np = user.nurse_profile;
      const licenseRegex = /^[A-Z]{2}\d{4,8}$/;
      if (!licenseRegex.test(np.license_number)) {
        flags.push("License number format appears invalid");
        licenseVerificationStatus = "invalid";
      } else {
        licenseVerificationStatus = "valid";
      }
    }

    return {
      user,
      profile: user.doctor_profile ?? user.nurse_profile ?? user.patient_profile,
      hospital: user.doctor_profile?.hospital ?? null,
      appointments_count: appointmentsCount,
      registration_date: user.created_at.toISOString(),
      license_verification_status: licenseVerificationStatus,
      specialty_valid: specialtyValid,
      flags,
    };
  }

  async approveUser(userId: string, adminId: string, ipAddress: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { doctor_profile: true, nurse_profile: true },
    });

    if (!user) throw new Error("User not found");

    await prisma.user.update({
      where: { id: userId },
      data: { status: "active" },
    });

    if (user.role === "doctor" && user.doctor_profile) {
      await prisma.doctorProfile.update({
        where: { user_id: userId },
        data: { approved_at: new Date(), approved_by: adminId },
      });
    }

    if (user.role === "nurse" && user.nurse_profile) {
      await prisma.nurseProfile.update({
        where: { user_id: userId },
        data: { approved_at: new Date(), approved_by: adminId },
      });
    }

    if (user.email) {
      emailService.sendApprovalEmail(user.email, user.full_name).catch((err) =>
        logger.error("Failed to send approval email:", err)
      );
    }

    notificationService.send({
      userId,
      type: "account_approved",
      title: "Account Approved!",
      message: "Your FCN account has been approved. You can now start accepting patients.",
      actionUrl: "/dashboard",
      channels: ["in_app", "fcm"],
      priority: "high",
    });

    const action = user.role === "doctor" ? ACTIVITY_ACTIONS.APPROVE_DOCTOR : ACTIVITY_ACTIONS.APPROVE_NURSE;
    await logActivity({
      actorId: adminId,
      actorRole: "super_admin",
      action,
      targetType: "User",
      targetId: userId,
      targetName: user.full_name,
      ipAddress,
    });
  }

  async rejectUser(userId: string, reason: string, adminId: string, ipAddress: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    await prisma.user.update({
      where: { id: userId },
      data: { status: "rejected", rejection_reason: reason },
    });

    if (user.email) {
      emailService.sendRejectionEmail(user.email, user.full_name, reason).catch((err) =>
        logger.error("Failed to send rejection email:", err)
      );
    }

    notificationService.send({
      userId,
      type: "account_rejected",
      title: "Account Update",
      message: `Your FCN account could not be approved. Reason: ${reason}`,
      channels: ["in_app"],
      priority: "normal",
    });

    const action = user.role === "doctor" ? ACTIVITY_ACTIONS.REJECT_DOCTOR : ACTIVITY_ACTIONS.REJECT_NURSE;
    await logActivity({
      actorId: adminId,
      actorRole: "super_admin",
      action,
      targetType: "User",
      targetId: userId,
      targetName: user.full_name,
      details: { reason },
      ipAddress,
    });
  }

  async suspendUser(userId: string, reason: string, adminId: string, ipAddress: string): Promise<void> {
    if (userId === adminId) {
      throw new Error("Super admin cannot suspend themselves");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    await prisma.user.update({
      where: { id: userId },
      data: { status: "suspended", suspended_reason: reason },
    });

    try {
      const pattern = `refresh:${userId}:*`;
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== "0");
    } catch (err) {
      logger.error("Failed to blacklist refresh tokens:", err);
    }

    notificationService.send({
      userId,
      type: "account_suspended",
      title: "Account Suspended",
      message: `Your FCN account has been suspended. Reason: ${reason}`,
      channels: ["in_app"],
      priority: "high",
    });

    await logActivity({
      actorId: adminId,
      actorRole: "super_admin",
      action: ACTIVITY_ACTIONS.SUSPEND_USER,
      targetType: "User",
      targetId: userId,
      targetName: user.full_name,
      details: { reason },
      ipAddress,
    });
  }

  async reactivateUser(userId: string, adminId: string, ipAddress: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    await prisma.user.update({
      where: { id: userId },
      data: { status: "active", suspended_reason: null },
    });

    notificationService.send({
      userId,
      type: "account_reactivated",
      title: "Account Reactivated",
      message: "Your FCN account has been reactivated. You can now use the platform.",
      actionUrl: "/dashboard",
      channels: ["in_app", "fcm"],
      priority: "high",
    });

    await logActivity({
      actorId: adminId,
      actorRole: "super_admin",
      action: ACTIVITY_ACTIONS.REACTIVATE_USER,
      targetType: "User",
      targetId: userId,
      targetName: user.full_name,
      ipAddress,
    });
  }

  async getActivityLogs(filters: GetActivityLogsFilters): Promise<PaginatedActivityLogs> {
    const { action, actorId, targetType, fromDate, toDate, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (action) where.action = action;
    if (actorId) where.actor_id = actorId;
    if (targetType) where.target_type = targetType;
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = new Date(fromDate);
      if (toDate) where.created_at.lte = new Date(toDate);
    }

    const [logs, total] = await Promise.all([
      (prisma as any).activityLog.findMany({
        where,
        include: {
          actor: { select: { id: true, full_name: true, email: true, role: true } },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      (prisma as any).activityLog.count({ where }),
    ]);

    return { logs, page, limit, total };
  }

  async updateSetting(key: string, value: string, adminId: string, ipAddress: string): Promise<void> {
    await systemSettings.set(key, value);

    let action: string = ACTIVITY_ACTIONS.UPDATE_SETTING;
    if (key === "payment_enabled") {
      action = value === "true" ? ACTIVITY_ACTIONS.ENABLE_PAYMENT : ACTIVITY_ACTIONS.DISABLE_PAYMENT;
    } else if (key === "sms_enabled" && value === "true") {
      action = ACTIVITY_ACTIONS.ENABLE_SMS;
    }

    await logActivity({
      actorId: adminId,
      actorRole: "super_admin",
      action,
      targetType: "Setting",
      targetId: key,
      targetName: key,
      details: { key, value },
      ipAddress,
    });
  }

  async getSettings(): Promise<Array<{ key: string; value: string; description: string | null }>> {
    return systemSettings.getAll();
  }

  async manualCleanup(adminId: string, ipAddress: string): Promise<number> {
    const retentionDays = Number(await systemSettings.get("message_retention_days")) || 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    const result = await prisma.message.deleteMany({
      where: { sent_at: { lt: cutoff } },
    });

    await logActivity({
      actorId: adminId,
      actorRole: "super_admin",
      action: ACTIVITY_ACTIONS.MANUAL_CLEANUP,
      targetType: "System",
      targetName: "Message Cleanup",
      details: { deleted_count: result.count, retention_days: retentionDays },
      ipAddress,
    });

    return result.count;
  }

  async clearAllNotifications(adminId: string, ipAddress: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { read: true },
    });

    await logActivity({
      actorId: adminId,
      actorRole: "super_admin",
      action: "CLEAR_NOTIFICATIONS",
      targetType: "System",
      targetName: "Notifications Cleanup",
      details: { deleted_count: result.count },
      ipAddress,
    });

    return result.count;
  }
}

export const adminService = new AdminService();

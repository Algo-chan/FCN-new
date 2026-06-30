import { prisma } from "../../config/database";

export class DashboardService {
  async getPatientDashboard(userId: string) {
    const [latestVitals, upcomingAppointments, activePrescriptions, unreadNotifications] = await Promise.all([
      prisma.patientVital.findFirst({
        where: { patient_id: userId },
        orderBy: { recorded_at: "desc" },
        include: { recorded_by_user: { select: { id: true, full_name: true, role: true } } }
      }),
      prisma.appointment.findMany({
        where: { patient_id: userId, status: { in: ["pending", "confirmed", "scheduled"] }, scheduled_at: { gte: new Date() } },
        orderBy: { scheduled_at: "asc" },
        take: 5,
        include: {
          doctor: { select: { id: true, full_name: true, doctor_profile: { select: { specialty: true } } } }
        }
      }),
      prisma.prescription.findMany({
        where: { patient_id: userId, status: { in: ["active", "refill_due"] } },
        orderBy: { issued_at: "desc" },
        take: 5,
        include: { medications: true, doctor: { select: { id: true, full_name: true } } }
      }),
      prisma.notification.count({ where: { user_id: userId, read: false } })
    ]);

    const healthScore = this.calculateHealthScore(latestVitals ?? undefined);

    return { latestVitals, upcomingAppointments, activePrescriptions, unreadNotifications, healthScore };
  }

  async getDoctorDashboard(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAppointmentsCount, totalPatientsCount, pendingAppointments, unreadNotifications, upcomingAppointments, recentPatients] = await Promise.all([
      prisma.appointment.count({
        where: { doctor_id: userId, scheduled_at: { gte: today, lt: tomorrow }, status: { not: "cancelled" } }
      }),
      prisma.appointment.groupBy({ by: ["patient_id"], where: { doctor_id: userId }, _count: { patient_id: true } }),
      prisma.appointment.count({ where: { doctor_id: userId, status: "pending" } }),
      prisma.notification.count({ where: { user_id: userId, read: false } }),
      prisma.appointment.findMany({
        where: { doctor_id: userId, scheduled_at: { gte: new Date() }, status: { in: ["confirmed", "scheduled"] } },
        orderBy: { scheduled_at: "asc" },
        take: 5,
        include: { patient: { select: { id: true, full_name: true } } }
      }),
      prisma.appointment.findMany({
        where: { doctor_id: userId, status: "completed" },
        orderBy: { updated_at: "desc" },
        take: 5,
        select: { patient: { select: { id: true, full_name: true } }, updated_at: true }
      })
    ]);

    const totalPatients = pendingAppointments > 0 ? pendingAppointments + totalPatientsCount.length : totalPatientsCount.length;

    return { todayAppointmentsCount, totalPatients, pendingAppointments, unreadNotifications, upcomingAppointments, recentPatients };
  }

  async getNurseDashboard(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [assignedPatientsCount, todayVisitsCount, recentVitals, unreadNotifications, upcomingVisits] = await Promise.all([
      prisma.appointment.groupBy({ by: ["patient_id"], where: { nurse_id: userId }, _count: { patient_id: true } }),
      prisma.appointment.count({
        where: { nurse_id: userId, appointment_type: "nurse_visit", scheduled_at: { gte: today, lt: tomorrow }, status: { not: "cancelled" } }
      }),
      prisma.patientVital.findMany({
        where: { recorded_by_user_id: userId },
        orderBy: { recorded_at: "desc" },
        take: 5,
        include: { patient: { select: { id: true, full_name: true } } }
      }),
      prisma.notification.count({ where: { user_id: userId, read: false } }),
      prisma.appointment.findMany({
        where: { nurse_id: userId, scheduled_at: { gte: new Date() }, status: { in: ["confirmed", "scheduled"] } },
        orderBy: { scheduled_at: "asc" },
        take: 5,
        include: { patient: { select: { id: true, full_name: true } } }
      })
    ]);

    return { assignedPatientsCount: assignedPatientsCount.length, todayVisitsCount, recentVitals, unreadNotifications, upcomingVisits };
  }

  async getAdminDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalUsers, usersByRole, pendingApprovals, activeHospitals, todayAppointments, unreadNotifications] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
      prisma.user.count({ where: { status: "pending", role: { in: ["doctor", "nurse", "rural_health_officer"] } } }),
      prisma.hospital.count({ where: { status: "active" } }),
      prisma.appointment.count({ where: { scheduled_at: { gte: today, lt: tomorrow }, status: "completed" } }),
      prisma.notification.count({ where: { read: false } })
    ]);

    return { totalUsers, usersByRole, pendingApprovals, activeHospitals, todayAppointments, unreadNotifications };
  }

  private calculateHealthScore(vitals?: { bp_systolic?: number | null; bp_diastolic?: number | null; heart_rate_bpm?: number | null; blood_glucose_mg_dl?: import("@prisma/client").Prisma.Decimal | null; spo2_percent?: import("@prisma/client").Prisma.Decimal | null; temperature_celsius?: import("@prisma/client").Prisma.Decimal | null }): number {
    if (!vitals) {
      return 0;
    }

    let score = 100;

    if (vitals.bp_systolic) {
      if (vitals.bp_systolic > 140 || vitals.bp_systolic < 90) {
        score -= (vitals.bp_systolic > 140 ? (vitals.bp_systolic - 140) * 0.5 : (90 - vitals.bp_systolic) * 0.5);
      }
    }

    if (vitals.bp_diastolic) {
      if (vitals.bp_diastolic > 90 || vitals.bp_diastolic < 60) {
        score -= (vitals.bp_diastolic > 90 ? (vitals.bp_diastolic - 90) * 0.5 : (60 - vitals.bp_diastolic) * 0.5);
      }
    }

    if (vitals.heart_rate_bpm) {
      if (vitals.heart_rate_bpm > 100 || vitals.heart_rate_bpm < 60) {
        score -= 10;
      }
    }

    if (vitals.blood_glucose_mg_dl) {
      const glucose = Number(vitals.blood_glucose_mg_dl);
      if (glucose > 140 || glucose < 70) {
        score -= 10;
      }
    }

    if (vitals.spo2_percent) {
      const spo2 = Number(vitals.spo2_percent);
      if (spo2 < 95) {
        score -= (95 - spo2) * 2;
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}

export const dashboardService = new DashboardService();

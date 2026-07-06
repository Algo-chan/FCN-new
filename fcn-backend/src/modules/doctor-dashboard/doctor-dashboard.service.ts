import { prisma } from "../../config/database";
import { AppError } from "../../utils/app-error";
import { systemSettings } from "../../utils/system-settings";
import { notificationService } from "../notifications/notification.service";
import crypto from "crypto";
import { env } from "../../config/env";

export class DoctorDashboardService {
  async getDoctorStats(doctorId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      todayAppointments,
      weekAppointments,
      weekCompleted,
      totalConsultations,
      totalPatientsResult,
      doctorProfile,
      pendingRequests,
      thisMonthCompleted,
      lastMonthCompleted,
    ] = await Promise.all([
      prisma.appointment.count({ where: { doctor_id: doctorId, scheduled_at: { gte: todayStart, lt: todayEnd }, status: { not: "cancelled" } } }),
      prisma.appointment.count({ where: { doctor_id: doctorId, scheduled_at: { gte: weekStart, lt: weekEnd }, status: { not: "cancelled" } } }),
      prisma.appointment.count({ where: { doctor_id: doctorId, status: "completed", updated_at: { gte: weekStart, lt: weekEnd } } }),
      prisma.appointment.count({ where: { doctor_id: doctorId, status: "completed" } }),
      prisma.appointment.findMany({ where: { doctor_id: doctorId, status: "completed" }, select: { patient_id: true }, distinct: ["patient_id"] }),
      prisma.doctorProfile.findUnique({ where: { user_id: doctorId }, select: { rating_average: true, rating_count: true, availability_status: true } }),
      prisma.appointment.count({ where: { doctor_id: doctorId, status: "pending" } }),
      prisma.appointment.count({ where: { doctor_id: doctorId, status: "completed", scheduled_at: { gte: monthStart } } }),
      prisma.appointment.count({ where: { doctor_id: doctorId, status: "completed", scheduled_at: { gte: lastMonthStart, lt: lastMonthEnd } } }),
    ]);

    const growthPercent = lastMonthCompleted > 0 ? ((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100 : 0;
    const freePeriodEnds = await systemSettings.get("free_period_ends_at");
    const paymentActive = await systemSettings.get("payment_enabled");

    return {
      today_appointments: todayAppointments,
      week_appointments: weekAppointments,
      week_completed: weekCompleted,
      total_consultations: totalConsultations,
      total_patients: totalPatientsResult.length,
      rating_average: doctorProfile ? Number(doctorProfile.rating_average) : 0,
      rating_count: doctorProfile ? doctorProfile.rating_count : 0,
      pending_requests: pendingRequests,
      consultations_this_month: thisMonthCompleted,
      consultations_last_month: lastMonthCompleted,
      growth_percent: Math.round(growthPercent * 100) / 100,
      current_status: doctorProfile?.availability_status ?? "unavailable",
      payment_status: paymentActive === "true" ? "active" : "pilot",
      free_period_ends_at: freePeriodEnds ?? null,
    };
  }

  async getDoctorSchedule(doctorId: string, date: string, view: "day" | "week") {
    const baseDate = new Date(date);

    if (view === "day") {
      const dayStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);

      const appointments = await prisma.appointment.findMany({
        where: {
          doctor_id: doctorId,
          scheduled_at: { gte: dayStart, lt: dayEnd },
          status: { not: "cancelled" },
        },
        include: {
          patient: { select: { id: true, full_name: true, patient_profile: { select: { date_of_birth: true } } } },
        },
        orderBy: { scheduled_at: "asc" },
      });

      return { date, appointments };
    }

    const weekStart = new Date(baseDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        scheduled_at: { gte: weekStart, lt: weekEnd },
        status: { not: "cancelled" },
      },
      include: {
        patient: { select: { id: true, full_name: true } },
      },
      orderBy: { scheduled_at: "asc" },
    });

    const days: { date: string; appointments: typeof appointments }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart.getTime() + i * 86400000);
      const dayStr = day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const dayAppts = appointments.filter((a) => {
        const aDate = new Date(a.scheduled_at);
        return aDate >= dayStart && aDate < dayEnd;
      });
      days.push({ date: dayStr, appointments: dayAppts });
    }

    return { week_start: weekStart.toISOString().split("T")[0], days };
  }

  async getActivePatients(doctorId: string) {
    const now = new Date();
    const appointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        status: { in: ["pending", "confirmed", "in_session"] },
        scheduled_at: { gte: now },
      },
      include: {
        patient: {
          include: {
            patient_profile: true,
          },
        },
      },
      orderBy: { scheduled_at: "asc" },
    });

    const patientMap = new Map<string, any>();
    for (const apt of appointments) {
      if (!patientMap.has(apt.patient_id)) {
        const pp = apt.patient.patient_profile;
        const age = pp?.date_of_birth
          ? Math.floor((now.getTime() - new Date(pp.date_of_birth).getTime()) / 31557600000)
          : null;

        const latestVitals = await prisma.patientVital.findFirst({
          where: { patient_id: apt.patient_id },
          orderBy: { recorded_at: "desc" },
          take: 1,
        });

        patientMap.set(apt.patient_id, {
          patient_id: apt.patient.id,
          full_name: apt.patient.full_name,
          photo_url: null,
          age,
          blood_type: pp?.blood_type ?? null,
          chronic_conditions: pp?.chronic_conditions ?? [],
          known_allergies: pp?.known_allergies ?? null,
          next_appointment: {
            id: apt.id,
            scheduled_at: apt.scheduled_at,
            type: apt.appointment_type,
            status: apt.status,
          },
          vitals_summary: latestVitals
            ? {
                bp_systolic: latestVitals.bp_systolic,
                bp_diastolic: latestVitals.bp_diastolic,
                heart_rate_bpm: latestVitals.heart_rate_bpm,
                temperature_celsius: latestVitals.temperature_celsius ? Number(latestVitals.temperature_celsius) : null,
                spo2_percent: latestVitals.spo2_percent ? Number(latestVitals.spo2_percent) : null,
                blood_glucose_mg_dl: latestVitals.blood_glucose_mg_dl ? Number(latestVitals.blood_glucose_mg_dl) : null,
              }
            : null,
        });
      }
    }

    return Array.from(patientMap.values());
  }

  async getPreviousPatients(doctorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const completedAppointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        status: "completed",
      },
      select: { patient_id: true, scheduled_at: true, appointment_type: true, id: true },
      orderBy: { scheduled_at: "desc" },
    });

    const patientMap = new Map<string, { last_date: Date; count: number; type: string[]; id: string }>();
    for (const apt of completedAppointments) {
      const existing = patientMap.get(apt.patient_id);
      if (existing) {
        existing.count++;
        if (apt.scheduled_at > existing.last_date) {
          existing.last_date = apt.scheduled_at;
          existing.type.push(apt.appointment_type);
        }
        if (!existing.type.includes(apt.appointment_type)) {
          existing.type.push(apt.appointment_type);
        }
      } else {
        patientMap.set(apt.patient_id, {
          last_date: apt.scheduled_at,
          count: 1,
          type: [apt.appointment_type],
          id: apt.id,
        });
      }
    }

    const patientIds = Array.from(patientMap.keys());
    const total = patientIds.length;
    const paginatedIds = patientIds.slice(skip, skip + limit);

    const patients = await prisma.user.findMany({
      where: { id: { in: paginatedIds } },
      select: {
        id: true,
        full_name: true,
        patient_profile: { select: { date_of_birth: true } },
      },
    });

    const now = new Date();
    const result = patients.map((p) => {
      const info = patientMap.get(p.id)!;
      const age = p.patient_profile?.date_of_birth
        ? Math.floor((now.getTime() - new Date(p.patient_profile.date_of_birth).getTime()) / 31557600000)
        : null;
      return {
        patient_id: p.id,
        full_name: p.full_name,
        age,
        last_consultation: info.last_date.toISOString(),
        last_appointment_type: info.type[info.type.length - 1],
        total_consultations: info.count,
      };
    });

    return { data: result, meta: { page, limit, total } };
  }

  async getEarningsSummary(doctorId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const totalCompleted = await prisma.appointment.count({ where: { doctor_id: doctorId, status: "completed" } });
    const thisMonthCompleted = await prisma.appointment.count({ where: { doctor_id: doctorId, status: "completed", scheduled_at: { gte: monthStart } } });
    const lastMonthCompleted = await prisma.appointment.count({ where: { doctor_id: doctorId, status: "completed", scheduled_at: { gte: lastMonthStart, lt: lastMonthEnd } } });
    const thisWeekCompleted = await prisma.appointment.count({ where: { doctor_id: doctorId, status: "completed", scheduled_at: { gte: weekStart } } });

    const growthVsLastMonth = lastMonthCompleted > 0 ? ((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100 : 0;

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await prisma.appointment.findMany({
      where: { doctor_id: doctorId, status: "completed", scheduled_at: { gte: sixMonthsAgo } },
      select: { scheduled_at: true },
      orderBy: { scheduled_at: "asc" },
    });

    const monthlyTrend: { month: string; consultations: number }[] = [];
    const monthMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      monthMap.set(key, 0);
    }
    for (const apt of monthlyData) {
      const key = apt.scheduled_at.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
      }
    }
    for (const [month, consultations] of monthMap) {
      monthlyTrend.push({ month, consultations });
    }

    const last4WeeksCompleted: number[] = [];
    for (let w = 0; w < 4; w++) {
      const ws = new Date(now);
      ws.setDate(ws.getDate() - ws.getDay() - w * 7);
      ws.setHours(0, 0, 0, 0);
      const we = new Date(ws.getTime() + 7 * 86400000);
      const count = await prisma.appointment.count({
        where: { doctor_id: doctorId, status: "completed", scheduled_at: { gte: ws, lt: we } },
      });
      last4WeeksCompleted.push(count);
    }
    const avgPerWeek = last4WeeksCompleted.reduce((a, b) => a + b, 0) / 4;

    const paymentStatus = await systemSettings.get("payment_enabled");
    const freePeriodEnds = await systemSettings.get("free_period_ends_at");

    return {
      total_completed: totalCompleted,
      this_month_completed: thisMonthCompleted,
      last_month_completed: lastMonthCompleted,
      this_week_completed: thisWeekCompleted,
      average_per_week: Math.round(avgPerWeek * 10) / 10,
      growth_vs_last_month: Math.round(growthVsLastMonth * 100) / 100,
      monthly_trend: monthlyTrend,
      payment_status: paymentStatus === "true" ? "active" : "pilot",
      pilot_message: paymentStatus !== "true" && freePeriodEnds
        ? `Earnings will be calculated when payment activates on ${freePeriodEnds}`
        : null,
    };
  }

  async issueFollowUpPrescription(doctorId: string, appointmentId: string, medications: any[]) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, full_name: true } },
        doctor: { select: { id: true, full_name: true } },
      },
    });

    if (!appointment) throw new AppError("Appointment not found", 404, "NOT_FOUND");
    if (appointment.doctor_id !== doctorId) throw new AppError("You are not the doctor for this appointment", 403, "FORBIDDEN");
    if (appointment.status !== "completed") throw new AppError("Can only issue follow-up prescription for completed appointments", 400, "BAD_REQUEST");

    const deadline = appointment.follow_up_prescription_deadline ?? (() => {
      const completedAt = appointment.completed_at ?? appointment.updated_at;
      const d = new Date(completedAt);
      d.setHours(d.getHours() + 48);
      return d;
    })();

    if (!appointment.follow_up_prescription_deadline) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { follow_up_prescription_deadline: deadline },
      });
    }

    if (deadline < new Date()) {
      throw new AppError(
        "Follow-up prescription window has expired. The 48-hour window after consultation completion has passed. Please ask the patient to book a new appointment.",
        400,
        "FOLLOWUP_EXPIRED"
      );
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const todayCount = await prisma.prescription.count({
      where: { rx_reference: { startsWith: `RX-${todayStr}` } },
    });

    const rxReference = `RX-${todayStr}-${String(todayCount + 1).padStart(3, "0")}`;
    const maxSupplyDays = Math.max(...medications.map((m: any) => (m.is_ongoing ? 30 : m.supply_days)));
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + maxSupplyDays);

    const prescription = await prisma.$transaction(async (tx) => {
      const presc = await tx.prescription.create({
        data: {
          rx_reference: rxReference,
          appointment_id: appointmentId,
          patient_id: appointment.patient_id,
          doctor_id: doctorId,
          status: "active",
          qr_hash: "",
          notes: `Follow-up prescription issued within 48 hours of consultation #${appointment.id}`,
          expires_at: expiresAt,
        },
      });

      const qrHash = crypto
        .createHmac("sha256", env.ENCRYPTION_KEY)
        .update(`${presc.id}:${appointment.patient_id}:${doctorId}`)
        .digest("hex");

      await tx.prescription.update({ where: { id: presc.id }, data: { qr_hash: qrHash } });

      for (const med of medications) {
        await tx.prescriptionMedication.create({
          data: {
            prescription_id: presc.id,
            drug_name: med.drug_name,
            strength: med.strength,
            form: med.form ?? null,
            instructions: med.instructions,
            frequency_per_day: med.frequency_per_day,
            reminder_times: med.reminder_times ?? [],
            supply_days: med.is_ongoing ? 30 : med.supply_days,
            is_ongoing: med.is_ongoing ?? false,
            quantity: med.quantity ?? null,
          },
        });
      }

      return tx.prescription.findUnique({ where: { id: presc.id }, include: { medications: true } });
    });

    await notificationService.send({
      userId: appointment.patient_id,
      type: "prescription_issued",
      title: "Follow-up Prescription Issued",
      message: `Dr. ${appointment.doctor.full_name} issued a follow-up prescription — ${medications.length} medication(s)`,
      actionUrl: `/pharmacy?prescription=${prescription!.id}`,
      channels: ["in_app", "fcm"],
    });

    return prescription;
  }

  async saveDoctorNote(doctorId: string, patientId: string, appointmentId: string | null, noteText: string) {
    const patient = await prisma.user.findUnique({ where: { id: patientId }, select: { id: true } });
    if (!patient) throw new AppError("Patient not found", 404, "NOT_FOUND");

    const note = await prisma.doctorNote.create({
      data: {
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_id: appointmentId,
        note_text: noteText,
        is_private: true,
      },
    });

    return note;
  }

  async getDoctorNotes(doctorId: string, patientId: string) {
    const notes = await prisma.doctorNote.findMany({
      where: { doctor_id: doctorId, patient_id: patientId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        note_text: true,
        is_private: true,
        created_at: true,
        updated_at: true,
        appointment_id: true,
      },
    });

    return notes;
  }
}

export const doctorDashboardService = new DoctorDashboardService();

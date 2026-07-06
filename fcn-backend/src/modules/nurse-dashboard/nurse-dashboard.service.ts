import { prisma } from "../../config/database";
import { AppError } from "../../utils/app-error";
import { notificationService } from "../notifications/notification.service";

export class NurseDashboardService {
  async getNurseStats(nurseId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    const [todayVisits, upcomingVisits, completedThisWeek, completedTotal, patientsServedResult, vitalsCount] = await Promise.all([
      prisma.appointment.count({ where: { nurse_id: nurseId, scheduled_at: { gte: todayStart, lt: todayEnd }, status: { not: "cancelled" } } }),
      prisma.appointment.count({ where: { nurse_id: nurseId, scheduled_at: { gte: todayEnd }, status: { not: "cancelled" } } }),
      prisma.appointment.count({ where: { nurse_id: nurseId, status: "completed", updated_at: { gte: weekStart, lt: weekEnd } } }),
      prisma.appointment.count({ where: { nurse_id: nurseId, status: "completed" } }),
      prisma.appointment.findMany({ where: { nurse_id: nurseId, status: "completed" }, select: { patient_id: true }, distinct: ["patient_id"] }),
      prisma.patientVital.count({ where: { recorded_by_user_id: nurseId } }),
    ]);

    const completedVisitCount = completedTotal > 0 ? completedTotal : 1;

    return {
      today_visits: todayVisits,
      upcoming_visits: upcomingVisits,
      completed_this_week: completedThisWeek,
      completed_total: completedTotal,
      patients_served: patientsServedResult.length,
      avg_vitals_per_visit: Math.round((vitalsCount / completedVisitCount) * 10) / 10,
    };
  }

  async getTodayVisits(nurseId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const visits = await prisma.appointment.findMany({
      where: {
        nurse_id: nurseId,
        scheduled_at: { gte: todayStart, lt: todayEnd },
        status: { not: "cancelled" },
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_profile: {
              select: {
                home_address: true,
                chronic_conditions: true,
                known_allergies: true,
                home_lat: true,
                home_lng: true,
              },
            },
          },
        },
      },
      orderBy: { scheduled_at: "asc" },
    });

    return visits.map((v) => {
      const diffMs = new Date(v.scheduled_at).getTime() - now.getTime();
      const diffMins = Math.round(diffMs / 60000);
      let timeLabel: string;
      if (diffMins < 0) {
        timeLabel = `${Math.abs(diffMins)} min ago`;
      } else if (diffMins < 60) {
        timeLabel = `In ${diffMins} min`;
      } else {
        const hours = Math.floor(diffMins / 60);
        timeLabel = `In ${hours}h ${diffMins % 60}m`;
      }

      return {
        id: v.id,
        patient_id: v.patient_id,
        patient_name: v.patient.full_name,
        home_address: v.patient.patient_profile?.home_address ?? null,
        home_lat: v.patient.patient_profile?.home_lat ? Number(v.patient.patient_profile.home_lat) : null,
        home_lng: v.patient.patient_profile?.home_lng ? Number(v.patient.patient_profile.home_lng) : null,
        chronic_conditions: v.patient.patient_profile?.chronic_conditions ?? [],
        known_allergies: v.patient.patient_profile?.known_allergies ?? null,
        scheduled_at: v.scheduled_at,
        status: v.status,
        appointment_type: v.appointment_type,
        time_label: timeLabel,
      };
    });
  }

  async getUpcomingVisits(nurseId: string) {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    todayEnd.setDate(todayEnd.getDate() + 1);

    const visits = await prisma.appointment.findMany({
      where: {
        nurse_id: nurseId,
        scheduled_at: { gte: todayEnd },
        status: { not: "cancelled" },
      },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            patient_profile: { select: { home_address: true } },
          },
        },
      },
      orderBy: { scheduled_at: "asc" },
      take: 5,
    });

    return visits.map((v) => ({
      id: v.id,
      patient_id: v.patient_id,
      patient_name: v.patient.full_name,
      home_address: v.patient.patient_profile?.home_address ?? null,
      scheduled_at: v.scheduled_at,
      status: v.status,
      appointment_type: v.appointment_type,
    }));
  }

  async getVisitPreparation(nurseId: string, appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            patient_profile: true,
          },
        },
      },
    });

    if (!appointment) throw new AppError("Appointment not found", 404, "NOT_FOUND");
    if (appointment.nurse_id !== nurseId) throw new AppError("You are not assigned to this visit", 403, "FORBIDDEN");

    const pp = appointment.patient.patient_profile;
    const age = pp?.date_of_birth
      ? Math.floor((new Date().getTime() - new Date(pp.date_of_birth).getTime()) / 31557600000)
      : null;

    const vitalsHistory = await prisma.patientVital.findMany({
      where: { patient_id: appointment.patient_id },
      orderBy: { recorded_at: "desc" },
      take: 10,
    });

    const latestVitals = await prisma.patientVital.findFirst({
      where: { patient_id: appointment.patient_id },
      orderBy: { recorded_at: "desc" },
      select: {
        bp_systolic: true,
        bp_diastolic: true,
        heart_rate_bpm: true,
        temperature_celsius: true,
        spo2_percent: true,
        blood_glucose_mg_dl: true,
        recorded_at: true,
      },
    });

    const activePrescriptions = await prisma.prescription.findMany({
      where: { patient_id: appointment.patient_id, status: "active" },
      include: { medications: true },
      orderBy: { issued_at: "desc" },
    });

    const previousVisits = await prisma.appointment.findMany({
      where: {
        nurse_id: nurseId,
        patient_id: appointment.patient_id,
        status: "completed",
        id: { not: appointmentId },
      },
      include: {
        patient: { select: { id: true, full_name: true } },
      },
      orderBy: { scheduled_at: "desc" },
      take: 3,
    });

    const conditions = pp?.chronic_conditions ?? [];
    const suggestions: string[] = [];
    suggestions.push("Record temperature");
    suggestions.push("Record heart rate");
    suggestions.push("Record weight");
    suggestions.push("Ask about current medications");
    suggestions.push("Check for any new symptoms");

    if (conditions.some((c) => c.toLowerCase().includes("diabet"))) {
      suggestions.push("Record blood glucose (fasting)");
      suggestions.push("Check feet for wounds/infections");
    }
    if (conditions.some((c) => c.toLowerCase().includes("hypertens") || c.toLowerCase().includes("blood pressure"))) {
      suggestions.push("Record blood pressure (both arms)");
      suggestions.push("Ask about headaches/dizziness");
    }
    if (conditions.some((c) => c.toLowerCase().includes("asthma") || c.toLowerCase().includes("respiratory"))) {
      suggestions.push("Record SpO2 oxygen saturation");
      suggestions.push("Ask about breathing difficulty");
    }

    const existingChecklist = await prisma.nurseVisitChecklist.findUnique({
      where: { appointment_id: appointmentId },
    });

    return {
      appointment: {
        id: appointment.id,
        scheduled_at: appointment.scheduled_at,
        status: appointment.status,
        appointment_type: appointment.appointment_type,
        chief_complaint: appointment.chief_complaint,
        duration_minutes: appointment.duration_minutes,
      },
      patient: {
        id: appointment.patient.id,
        full_name: appointment.patient.full_name,
        phone: appointment.patient.phone,
        date_of_birth: pp?.date_of_birth?.toISOString() ?? null,
        age,
        blood_type: pp?.blood_type ?? null,
        home_address: pp?.home_address ?? null,
        home_lat: pp?.home_lat ? Number(pp.home_lat) : null,
        home_lng: pp?.home_lng ? Number(pp.home_lng) : null,
        emergency_contact_name: pp?.emergency_contact_name ?? null,
        emergency_contact_phone: pp?.emergency_contact_phone ?? null,
        chronic_conditions: conditions,
        known_allergies: pp?.known_allergies ?? null,
      },
      vitals_history: vitalsHistory.map((v) => ({
        ...v,
        temperature_celsius: v.temperature_celsius ? Number(v.temperature_celsius) : null,
        spo2_percent: v.spo2_percent ? Number(v.spo2_percent) : null,
        blood_glucose_mg_dl: v.blood_glucose_mg_dl ? Number(v.blood_glucose_mg_dl) : null,
        weight_kg: v.weight_kg ? Number(v.weight_kg) : null,
        height_cm: v.height_cm ? Number(v.height_cm) : null,
        bmi: v.bmi ? Number(v.bmi) : null,
      })),
      latest_vitals: latestVitals
        ? {
            bp_systolic: latestVitals.bp_systolic,
            bp_diastolic: latestVitals.bp_diastolic,
            heart_rate_bpm: latestVitals.heart_rate_bpm,
            temperature_celsius: latestVitals.temperature_celsius ? Number(latestVitals.temperature_celsius) : null,
            spo2_percent: latestVitals.spo2_percent ? Number(latestVitals.spo2_percent) : null,
            blood_glucose_mg_dl: latestVitals.blood_glucose_mg_dl ? Number(latestVitals.blood_glucose_mg_dl) : null,
            recorded_at: latestVitals.recorded_at.toISOString(),
          }
        : null,
      active_prescriptions: activePrescriptions,
      previous_visits: previousVisits,
      suggested_checklist: suggestions,
      doctor_instructions: appointment.chief_complaint ?? null,
      existing_checklist: existingChecklist,
    };
  }

  async saveVisitChecklist(nurseId: string, appointmentId: string, items: string[]) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { id: true, nurse_id: true },
    });
    if (!appointment) throw new AppError("Appointment not found", 404, "NOT_FOUND");
    if (appointment.nurse_id !== nurseId) throw new AppError("You are not assigned to this visit", 403, "FORBIDDEN");

    const checklist = await prisma.nurseVisitChecklist.upsert({
      where: { appointment_id: appointmentId },
      create: {
        appointment_id: appointmentId,
        items: JSON.stringify(items),
        completed_items: "[]",
      },
      update: {
        items: JSON.stringify(items),
      },
    });

    return checklist;
  }

  async updateVisitChecklist(nurseId: string, appointmentId: string, completedItems: string[], notes?: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, full_name: true } },
        nurse: { select: { id: true, full_name: true } },
      },
    });
    if (!appointment) throw new AppError("Appointment not found", 404, "NOT_FOUND");
    if (appointment.nurse_id !== nurseId) throw new AppError("You are not assigned to this visit", 403, "FORBIDDEN");

    const existing = await prisma.nurseVisitChecklist.findUnique({
      where: { appointment_id: appointmentId },
    });

    const allItems = existing ? (JSON.parse(typeof existing.items === "string" ? existing.items : JSON.stringify(existing.items)) as string[]) : [];
    const allCompleted = allItems.length > 0 && completedItems.length >= allItems.length;

    const updateData: any = {
      completed_items: JSON.stringify(completedItems),
    };
    if (notes !== undefined) updateData.notes = notes;
    if (allCompleted) updateData.completed_at = new Date();

    const updated = await prisma.nurseVisitChecklist.upsert({
      where: { appointment_id: appointmentId },
      create: {
        appointment_id: appointmentId,
        items: "[]",
        completed_items: JSON.stringify(completedItems),
        notes: notes ?? null,
        completed_at: allCompleted ? new Date() : null,
      },
      update: updateData,
    });

    if (allCompleted) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: "completed", completed_at: new Date() },
      });

      await notificationService.send({
        userId: appointment.doctor_id,
        type: "visit_completed",
        title: "Nurse Visit Completed",
        message: `🏠 Nurse ${appointment.nurse?.full_name ?? "Unknown"} completed home visit for ${appointment.patient.full_name}. Vitals have been recorded.`,
        actionUrl: `/appointments/${appointmentId}`,
        channels: ["in_app", "fcm"],
      });
    }

    return updated;
  }

  async getVisitHistory(nurseId: string) {
    const visits = await prisma.appointment.findMany({
      where: {
        nurse_id: nurseId,
        status: "completed",
      },
      include: {
        patient: { select: { id: true, full_name: true } },
      },
      orderBy: { scheduled_at: "desc" },
      take: 20,
    });

    return visits.map((v) => ({
      id: v.id,
      patient_id: v.patient_id,
      patient_name: v.patient.full_name,
      scheduled_at: v.scheduled_at,
      status: v.status,
      appointment_type: v.appointment_type,
    }));
  }
}

export const nurseDashboardService = new NurseDashboardService();

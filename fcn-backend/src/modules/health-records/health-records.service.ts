import { prisma } from "../../config/database";
import { AppError } from "../../utils/app-error";
import { notificationService } from "../notifications/notification.service";
import { logger } from "../../utils/logger";
import type { RecordVitalsDto, GetVitalsHistoryDto } from "./health-records.validators";

interface LatestVitalValue {
  value: number | null;
  recorded_at: string | null;
  status: "normal" | "warning" | "critical";
}

interface LatestVitals {
  bp: { systolic: number | null; diastolic: number | null; recorded_at: string | null; status: string } | null;
  glucose: LatestVitalValue | null;
  heart_rate: LatestVitalValue | null;
  temperature: LatestVitalValue | null;
  spo2: LatestVitalValue | null;
  weight: { value: number | null; recorded_at: string | null } | null;
  bmi: LatestVitalValue | null;
}

interface TrendPoint {
  date: string;
  systolic: number | null;
  diastolic: number | null;
}

interface GlucoseTrendPoint {
  date: string;
  value: number | null;
}

interface VitalsTrends {
  bp_trend: TrendPoint[];
  glucose_trend: GlucoseTrendPoint[];
  temperature_trend: GlucoseTrendPoint[];
  weight_trend: GlucoseTrendPoint[];
}

interface NursePatient {
  id: string;
  full_name: string;
  phone: string | null;
  home_address: string | null;
  latest_vitals: LatestVitals | null;
  next_visit: string | null;
  total_visits: number;
}

interface VitalsPDFData {
  patient: {
    full_name: string;
    date_of_birth: string | null;
    blood_type: string | null;
    phone: string | null;
    home_address: string | null;
  };
  patientProfile: {
    chronic_conditions: string[];
    known_allergies: string | null;
    weight_kg: number | null;
    height_cm: number | null;
  } | null;
  vitalsHistory: unknown[];
  latestVitals: LatestVitals;
  generatedAt: string;
  generatedBy: string;
}

interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function computeVitalStatus(
  type: "bp_systolic" | "bp_diastolic" | "glucose" | "heart_rate" | "temperature" | "spo2",
  value: number
): "normal" | "warning" | "critical" {
  switch (type) {
    case "bp_systolic":
      if (value < 90) return "critical";
      if (value >= 160) return "critical";
      if (value >= 140) return "warning";
      return "normal";
    case "bp_diastolic":
      if (value < 60) return "critical";
      if (value >= 100) return "critical";
      if (value >= 90) return "warning";
      return "normal";
    case "glucose":
      if (value < 70) return "critical";
      if (value > 180) return "critical";
      if (value > 125) return "warning";
      return "normal";
    case "heart_rate":
      if (value > 150) return "critical";
      if (value > 100) return "warning";
      if (value < 60) return "warning";
      return "normal";
    case "temperature":
      if (value >= 38.5) return "critical";
      if (value >= 37.6) return "warning";
      if (value < 36.1) return "warning";
      return "normal";
    case "spo2":
      if (value < 95) return "critical";
      return "normal";
  }
}

function computeBMIStatus(bmi: number): "normal" | "warning" | "critical" {
  if (bmi < 18.5) return "warning";
  if (bmi >= 30) return "critical";
  if (bmi >= 25) return "warning";
  return "normal";
}

export class HealthRecordsService {
  async recordVitals(
    recorderId: string,
    recorderRole: string,
    data: RecordVitalsDto
  ): Promise<unknown> {
    let patientId = data.patient_id;
    let vitalSource: string;

    if (recorderRole === "patient") {
      patientId = recorderId;
      vitalSource = "self";
    } else if (recorderRole === "nurse" || recorderRole === "rural_health_officer") {
      if (!patientId) {
        throw new AppError("patient_id is required for nurse recordings", 400, "MISSING_PATIENT_ID");
      }
      const activeAppointment = await prisma.appointment.findFirst({
        where: {
          nurse_id: recorderId,
          patient_id: patientId,
          appointment_type: "nurse_visit",
          status: { in: ["confirmed", "scheduled", "in_session"] }
        }
      });
      if (!activeAppointment) {
        throw new AppError("You are not assigned to this patient", 403, "NOT_ASSIGNED");
      }
      vitalSource = "nurse";
    } else if (recorderRole === "doctor") {
      if (!patientId) {
        throw new AppError("patient_id is required", 400, "MISSING_PATIENT_ID");
      }
      const sharedAppointment = await prisma.appointment.findFirst({
        where: {
          doctor_id: recorderId,
          patient_id: patientId,
          status: { in: ["completed", "in_session", "confirmed", "scheduled"] }
        }
      });
      if (!sharedAppointment) {
        throw new AppError("You do not have a patient-provider relationship with this patient", 403, "NO_RELATIONSHIP");
      }
      vitalSource = "doctor";
    } else {
      throw new AppError("Invalid role for recording vitals", 403, "INVALID_ROLE");
    }

    const patientExists = await prisma.user.findUnique({ where: { id: patientId } });
    if (!patientExists) {
      throw new AppError("Patient not found", 404, "NOT_FOUND");
    }

    let bmi: number | null = null;
    if (data.weight_kg !== undefined && data.height_cm !== undefined) {
      bmi = Math.round((data.weight_kg / ((data.height_cm / 100) ** 2)) * 10) / 10;
    } else if (data.weight_kg !== undefined) {
      const latestWithHeight = await prisma.patientVital.findFirst({
        where: { patient_id: patientId, height_cm: { not: null } },
        orderBy: { recorded_at: "desc" }
      });
      if (latestWithHeight?.height_cm) {
        const hCm = Number(latestWithHeight.height_cm);
        bmi = Math.round((data.weight_kg / ((hCm / 100) ** 2)) * 10) / 10;
      }
    }

    const flaggedReasons: string[] = [];
    if (data.spo2_percent !== undefined && data.spo2_percent < 95) {
      flaggedReasons.push("spo2_critical");
    }
    if (data.bp_systolic !== undefined && data.bp_systolic >= 160) {
      flaggedReasons.push("bp_systolic_critical");
    }
    if (data.bp_diastolic !== undefined && data.bp_diastolic >= 100) {
      flaggedReasons.push("bp_diastolic_critical");
    }
    if (data.blood_glucose_mg_dl !== undefined && data.blood_glucose_mg_dl > 180) {
      flaggedReasons.push("glucose_critical");
    }
    if (data.temperature_celsius !== undefined && data.temperature_celsius >= 38.5) {
      flaggedReasons.push("temperature_critical");
    }
    if (data.heart_rate_bpm !== undefined && data.heart_rate_bpm > 150) {
      flaggedReasons.push("heart_rate_critical");
    }
    const isFlagged = flaggedReasons.length > 0;

    const vital = await prisma.patientVital.create({
      data: {
        patient_id: patientId,
        recorded_by_user_id: recorderId,
        bp_systolic: data.bp_systolic ?? null,
        bp_diastolic: data.bp_diastolic ?? null,
        blood_glucose_mg_dl: data.blood_glucose_mg_dl ?? null,
        heart_rate_bpm: data.heart_rate_bpm ?? null,
        temperature_celsius: data.temperature_celsius ?? null,
        spo2_percent: data.spo2_percent ?? null,
        weight_kg: data.weight_kg ?? null,
        height_cm: data.height_cm ?? null,
        bmi: bmi,
        vital_source: vitalSource,
        is_flagged: isFlagged,
        flagged_reasons: flaggedReasons,
        notes: data.notes ?? null,
        appointment_id: data.appointment_id ?? null
      },
      include: {
        recorded_by_user: { select: { id: true, full_name: true, role: true } }
      }
    });

    if (data.weight_kg !== undefined || data.height_cm !== undefined) {
      const profileUpdate: Record<string, unknown> = {};
      if (data.weight_kg !== undefined) profileUpdate.weight_kg = data.weight_kg;
      if (data.height_cm !== undefined) profileUpdate.height_cm = data.height_cm;
      await prisma.patientProfile.upsert({
        where: { user_id: patientId },
        create: { user_id: patientId, ...profileUpdate },
        update: profileUpdate
      });
    }

    if (isFlagged) {
      try {
        await notificationService.send({
          userId: patientId,
          type: "vital_alert",
          title: "⚠️ Critical Vital Sign Detected",
          message: "One or more of your vital readings requires immediate attention. Please consult a doctor.",
          actionUrl: "/ai-check",
          sendPush: true
        });
      } catch (err) {
        logger.error("Failed to send vital alert notification", { error: err });
      }
    }

    logger.info(`vitals recorded for patient ${patientId} by ${recorderRole} ${recorderId}`);
    return vital;
  }

  async getVitalsHistory(
    patientId: string,
    requesterId: string,
    requesterRole: string,
    filters: GetVitalsHistoryDto
  ): Promise<PaginatedResult<unknown>> {
    await this.verifyAccess(patientId, requesterId, requesterRole);

    const where: Record<string, unknown> = { patient_id: patientId };
    if (filters.from_date || filters.to_date) {
      const recordedAtFilter: Record<string, Date> = {};
      if (filters.from_date) recordedAtFilter.gte = new Date(filters.from_date);
      if (filters.to_date) recordedAtFilter.lte = new Date(filters.to_date);
      where.recorded_at = recordedAtFilter;
    }

    const total = await prisma.patientVital.count({ where: where as any });
    const vitals = await prisma.patientVital.findMany({
      where: where as any,
      orderBy: { recorded_at: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        recorded_by_user: { select: { id: true, full_name: true, role: true } }
      }
    });

    return {
      data: vitals,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      }
    };
  }

  async getLatestVitals(
    patientId: string,
    requesterId: string,
    requesterRole: string
  ): Promise<LatestVitals> {
    await this.verifyAccess(patientId, requesterId, requesterRole);

    const [bpRow, glucoseRow, hrRow, tempRow, spo2Row, weightRow, bmiEntry] = await Promise.all([
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, bp_systolic: { not: null } },
        orderBy: { recorded_at: "desc" },
        select: { bp_systolic: true, bp_diastolic: true, recorded_at: true }
      }),
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, blood_glucose_mg_dl: { not: null } },
        orderBy: { recorded_at: "desc" },
        select: { blood_glucose_mg_dl: true, recorded_at: true }
      }),
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, heart_rate_bpm: { not: null } },
        orderBy: { recorded_at: "desc" },
        select: { heart_rate_bpm: true, recorded_at: true }
      }),
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, temperature_celsius: { not: null } },
        orderBy: { recorded_at: "desc" },
        select: { temperature_celsius: true, recorded_at: true }
      }),
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, spo2_percent: { not: null } },
        orderBy: { recorded_at: "desc" },
        select: { spo2_percent: true, recorded_at: true }
      }),
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, weight_kg: { not: null } },
        orderBy: { recorded_at: "desc" },
        select: { weight_kg: true, recorded_at: true }
      }),
      prisma.patientVital.findFirst({
        where: { patient_id: patientId, bmi: { not: null } },
        orderBy: { recorded_at: "desc" },
        select: { bmi: true, recorded_at: true }
      })
    ]);

    return {
      bp: bpRow
        ? {
            systolic: bpRow.bp_systolic ?? null,
            diastolic: bpRow.bp_diastolic ?? null,
            recorded_at: bpRow.recorded_at.toISOString(),
            status: this.computeBPStatus(bpRow.bp_systolic ?? 0, bpRow.bp_diastolic ?? 0)
          }
        : null,
      glucose: glucoseRow
        ? {
            value: Number(glucoseRow.blood_glucose_mg_dl),
            recorded_at: glucoseRow.recorded_at.toISOString(),
            status: computeVitalStatus("glucose", Number(glucoseRow.blood_glucose_mg_dl))
          }
        : null,
      heart_rate: hrRow
        ? {
            value: hrRow.heart_rate_bpm,
            recorded_at: hrRow.recorded_at.toISOString(),
            status: computeVitalStatus("heart_rate", hrRow.heart_rate_bpm ?? 0)
          }
        : null,
      temperature: tempRow
        ? {
            value: Number(tempRow.temperature_celsius),
            recorded_at: tempRow.recorded_at.toISOString(),
            status: computeVitalStatus("temperature", Number(tempRow.temperature_celsius))
          }
        : null,
      spo2: spo2Row
        ? {
            value: Number(spo2Row.spo2_percent),
            recorded_at: spo2Row.recorded_at.toISOString(),
            status: computeVitalStatus("spo2", Number(spo2Row.spo2_percent))
          }
        : null,
      weight: weightRow
        ? { value: Number(weightRow.weight_kg), recorded_at: weightRow.recorded_at.toISOString() }
        : null,
      bmi: bmiEntry
        ? {
            value: Number(bmiEntry.bmi),
            recorded_at: bmiEntry.recorded_at.toISOString(),
            status: computeBMIStatus(Number(bmiEntry.bmi))
          }
        : null
    };
  }

  async getVitalsTrends(
    patientId: string,
    requesterId: string,
    requesterRole: string
  ): Promise<VitalsTrends> {
    await this.verifyAccess(patientId, requesterId, requesterRole);

    const now = new Date();
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    const dayStarts = days.map((d) => {
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      return start;
    });

    const dayEnds = days.map((d) => {
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return end;
    });

    const formatDate = (d: Date) => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    };

    const bpTrend: TrendPoint[] = [];
    const glucoseTrend: GlucoseTrendPoint[] = [];
    const temperatureTrend: GlucoseTrendPoint[] = [];
    const weightTrend: GlucoseTrendPoint[] = [];

    for (let i = 0; i < 7; i++) {
      const start = dayStarts[i];
      const end = dayEnds[i];
      const dateLabel = formatDate(days[i]);

      const dayVitals = await prisma.patientVital.findMany({
        where: {
          patient_id: patientId,
          recorded_at: { gte: start, lte: end }
        }
      });

      const bpSystolicValues = dayVitals.filter((v) => v.bp_systolic !== null).map((v) => v.bp_systolic!);
      const bpDiastolicValues = dayVitals.filter((v) => v.bp_diastolic !== null).map((v) => v.bp_diastolic!);
      const glucoseValues = dayVitals.filter((v) => v.blood_glucose_mg_dl !== null).map((v) => Number(v.blood_glucose_mg_dl!));
      const tempValues = dayVitals.filter((v) => v.temperature_celsius !== null).map((v) => Number(v.temperature_celsius!));
      const weightValues = dayVitals.filter((v) => v.weight_kg !== null).map((v) => Number(v.weight_kg!));

      const avg = (arr: number[]) => (arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null);

      bpTrend.push({
        date: dateLabel,
        systolic: bpSystolicValues.length > 0 ? Math.round(bpSystolicValues.reduce((a, b) => a + b, 0) / bpSystolicValues.length) : null,
        diastolic: bpDiastolicValues.length > 0 ? Math.round(bpDiastolicValues.reduce((a, b) => a + b, 0) / bpDiastolicValues.length) : null
      });
      glucoseTrend.push({ date: dateLabel, value: glucoseValues.length > 0 ? avg(glucoseValues) : null });
      temperatureTrend.push({ date: dateLabel, value: tempValues.length > 0 ? avg(tempValues) : null });
      weightTrend.push({ date: dateLabel, value: weightValues.length > 0 ? avg(weightValues) : null });
    }

    return {
      bp_trend: bpTrend,
      glucose_trend: glucoseTrend,
      temperature_trend: temperatureTrend,
      weight_trend: weightTrend
    };
  }

  async generateVitalsPDFData(
    patientId: string,
    requesterId: string,
    requesterRole: string
  ): Promise<VitalsPDFData> {
    await this.verifyAccess(patientId, requesterId, requesterRole);

    const [patient, vitalsHistory, latestVitals, recorder] = await Promise.all([
      prisma.user.findUnique({
        where: { id: patientId },
        include: { patient_profile: true }
      }),
      prisma.patientVital.findMany({
        where: { patient_id: patientId },
        orderBy: { recorded_at: "desc" },
        take: 500,
        include: {
          recorded_by_user: { select: { id: true, full_name: true, role: true } }
        }
      }),
      this.getLatestVitals(patientId, requesterId, requesterRole),
      prisma.user.findUnique({ where: { id: requesterId }, select: { full_name: true } })
    ]);

    if (!patient) {
      throw new AppError("Patient not found", 404, "NOT_FOUND");
    }

    return {
      patient: {
        full_name: patient.full_name,
        date_of_birth: patient.patient_profile?.date_of_birth?.toISOString() ?? null,
        blood_type: patient.patient_profile?.blood_type ?? null,
        phone: patient.phone ?? null,
        home_address: patient.patient_profile?.home_address ?? null
      },
      patientProfile: patient.patient_profile
        ? {
            chronic_conditions: patient.patient_profile.chronic_conditions,
            known_allergies: patient.patient_profile.known_allergies,
            weight_kg: patient.patient_profile.weight_kg ? Number(patient.patient_profile.weight_kg) : null,
            height_cm: patient.patient_profile.height_cm ? Number(patient.patient_profile.height_cm) : null
          }
        : null,
      vitalsHistory,
      latestVitals,
      generatedAt: new Date().toISOString(),
      generatedBy: recorder?.full_name ?? "Unknown"
    };
  }

  async getNursePatients(nurseId: string): Promise<NursePatient[]> {
    const appointments = await prisma.appointment.findMany({
      where: {
        nurse_id: nurseId,
        appointment_type: "nurse_visit",
        status: { in: ["confirmed", "scheduled", "in_session", "completed"] }
      },
      include: {
        patient: {
          include: { patient_profile: true }
        }
      },
      orderBy: { scheduled_at: "desc" }
    });

    const patientMap = new Map<string, NursePatient>();

    for (const apt of appointments) {
      const pid = apt.patient_id;
      if (patientMap.has(pid)) continue;

      const nextVisit = await prisma.appointment.findFirst({
        where: {
          nurse_id: nurseId,
          patient_id: pid,
          appointment_type: "nurse_visit",
          status: { in: ["confirmed", "scheduled"] },
          scheduled_at: { gte: new Date() }
        },
        orderBy: { scheduled_at: "asc" }
      });

      const totalVisits = await prisma.appointment.count({
        where: {
          nurse_id: nurseId,
          patient_id: pid,
          appointment_type: "nurse_visit",
          status: "completed"
        }
      });

      let latestVitals: LatestVitals | null = null;
      try {
        latestVitals = await this.getLatestVitals(pid, nurseId, "nurse");
      } catch {
        // not accessible
      }

      patientMap.set(pid, {
        id: pid,
        full_name: apt.patient.full_name,
        phone: apt.patient.phone,
        home_address: apt.patient.patient_profile?.home_address ?? null,
        latest_vitals: latestVitals,
        next_visit: nextVisit?.scheduled_at.toISOString() ?? null,
        total_visits: totalVisits
      });
    }

    return Array.from(patientMap.values());
  }

  private computeBPStatus(systolic: number, diastolic: number): string {
    const sStatus = computeVitalStatus("bp_systolic", systolic);
    const dStatus = computeVitalStatus("bp_diastolic", diastolic);
    if (sStatus === "critical" || dStatus === "critical") return "critical";
    if (sStatus === "warning" || dStatus === "warning") return "warning";
    return "normal";
  }

  private async verifyAccess(
    patientId: string,
    requesterId: string,
    requesterRole: string
  ): Promise<void> {
    if (requesterRole === "super_admin") return;

    if (requesterRole === "patient") {
      if (patientId !== requesterId) {
        throw new AppError("You can only access your own health records", 403, "FORBIDDEN");
      }
      return;
    }

    if (requesterRole === "doctor") {
      const hasAppointment = await prisma.appointment.findFirst({
        where: {
          doctor_id: requesterId,
          patient_id: patientId,
          status: { in: ["completed", "in_session", "confirmed", "scheduled"] }
        }
      });
      if (!hasAppointment) {
        throw new AppError("You are not this patient's doctor", 403, "FORBIDDEN");
      }
      return;
    }

    if (requesterRole === "nurse" || requesterRole === "rural_health_officer") {
      const hasAppointment = await prisma.appointment.findFirst({
        where: {
          nurse_id: requesterId,
          patient_id: patientId,
          appointment_type: "nurse_visit",
          status: { in: ["confirmed", "scheduled", "in_session", "completed"] }
        }
      });
      if (!hasAppointment) {
        throw new AppError("You are not assigned to this patient", 403, "FORBIDDEN");
      }
      return;
    }

    throw new AppError("Access denied", 403, "FORBIDDEN");
  }
}

export const healthRecordsService = new HealthRecordsService();

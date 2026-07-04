import { prisma } from "../../config/database";
import { decrypt, encrypt } from "../../utils/encryption";
import { decryptMessage, computeAge } from "./consultation.helpers";
import { AppError } from "../../utils/app-error";
import { systemSettings } from "../../utils/system-settings";
import { notificationService } from "../notifications/notification.service";
import { logger } from "../../utils/logger";
import type { IssuePrescriptionDto } from "./consultation.validators";
import crypto from "crypto";
import { env } from "../../config/env";

export class ConsultationService {
  async getMessages(
    appointmentId: string,
    requesterId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { patient_id: true, doctor_id: true }
    });

    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    if (appointment.patient_id !== requesterId && appointment.doctor_id !== requesterId) {
      throw new AppError("You are not authorized to view these messages", 403, "FORBIDDEN");
    }

    const total = await prisma.message.count({
      where: { appointment_id: appointmentId, deleted_at: null }
    });

    const messages = await prisma.message.findMany({
      where: { appointment_id: appointmentId, deleted_at: null },
      orderBy: { sent_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: { select: { id: true, full_name: true } }
      }
    });

    const decryptedMessages = messages.map((msg) => decryptMessage(msg));

    return {
      messages: decryptedMessages.reverse(),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getConsultationContext(appointmentId: string, requesterId: string, requesterRole: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            patient_profile: true
          }
        },
        doctor: {
          select: {
            id: true,
            full_name: true,
            email: true,
            doctor_profile: true
          }
        }
      }
    });

    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    const isDoctor = appointment.doctor_id === requesterId;
    const isPatient = appointment.patient_id === requesterId;

    if (!isDoctor && !isPatient) {
      throw new AppError("You are not authorized for this consultation", 403, "FORBIDDEN");
    }

    const isReadOnly = appointment.status === "completed" || appointment.status === "cancelled";

    let consultationContext = null;

    if (isDoctor) {
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { user_id: appointment.patient_id }
      });

      const latestVitalsPromise = Promise.all([
        prisma.patientVital.findFirst({
          where: { patient_id: appointment.patient_id, bp_systolic: { not: null } },
          orderBy: { recorded_at: "desc" }
        }),
        prisma.patientVital.findFirst({
          where: { patient_id: appointment.patient_id, blood_glucose_mg_dl: { not: null } },
          orderBy: { recorded_at: "desc" }
        }),
        prisma.patientVital.findFirst({
          where: { patient_id: appointment.patient_id, heart_rate_bpm: { not: null } },
          orderBy: { recorded_at: "desc" }
        }),
        prisma.patientVital.findFirst({
          where: { patient_id: appointment.patient_id, temperature_celsius: { not: null } },
          orderBy: { recorded_at: "desc" }
        }),
        prisma.patientVital.findFirst({
          where: { patient_id: appointment.patient_id, spo2_percent: { not: null } },
          orderBy: { recorded_at: "desc" }
        })
      ]);

      const activePrescriptionsPromise = prisma.prescription.findMany({
        where: {
          patient_id: appointment.patient_id,
          status: { in: ["active", "refill_due"] }
        },
        include: { medications: true },
        orderBy: { issued_at: "desc" },
        take: 10
      });

      const appointmentHistoryPromise = prisma.appointment.count({
        where: { patient_id: appointment.patient_id }
      });

      const completedAppointmentsPromise = prisma.appointment.count({
        where: { patient_id: appointment.patient_id, status: "completed" }
      });

      const [latestVitals, activePrescriptions, totalAppointments, completedAppointments] =
        await Promise.all([
          latestVitalsPromise,
          activePrescriptionsPromise,
          appointmentHistoryPromise,
          completedAppointmentsPromise
        ]);

      const vitalsMap = {
        bp_systolic: latestVitals[0]?.bp_systolic ?? null,
        bp_diastolic: latestVitals[0]?.bp_diastolic ?? null,
        blood_glucose_mg_dl: latestVitals[1]?.blood_glucose_mg_dl ? Number(latestVitals[1].blood_glucose_mg_dl) : null,
        heart_rate_bpm: latestVitals[2]?.heart_rate_bpm ?? null,
        temperature_celsius: latestVitals[3]?.temperature_celsius ? Number(latestVitals[3].temperature_celsius) : null,
        spo2_percent: latestVitals[4]?.spo2_percent ? Number(latestVitals[4].spo2_percent) : null,
        recorded_at: latestVitals.find((v) => v !== null)?.recorded_at.toISOString() ?? null
      };

      consultationContext = {
        patient: {
          id: appointment.patient.id,
          full_name: appointment.patient.full_name,
          email: appointment.patient.email,
          phone: appointment.patient.phone
        },
        patientProfile: patientProfile
          ? {
              date_of_birth: patientProfile.date_of_birth?.toISOString() ?? null,
              blood_type: patientProfile.blood_type,
              weight_kg: patientProfile.weight_kg ? Number(patientProfile.weight_kg) : null,
              height_cm: patientProfile.height_cm ? Number(patientProfile.height_cm) : null,
              chronic_conditions: patientProfile.chronic_conditions,
              known_allergies: patientProfile.known_allergies,
              home_address: patientProfile.home_address,
              emergency_contact_name: patientProfile.emergency_contact_name,
              emergency_contact_phone: patientProfile.emergency_contact_phone
            }
          : null,
        latestVitals: vitalsMap,
        activePrescriptions,
        appointmentHistory: {
          total: totalAppointments,
          completed: completedAppointments
        }
      };
    }

    return {
      appointment: {
        id: appointment.id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_type: appointment.appointment_type,
        status: appointment.status,
        scheduled_at: appointment.scheduled_at.toISOString(),
        chief_complaint: appointment.chief_complaint,
        consultation_started_at: appointment.consultation_started_at?.toISOString() ?? null,
        consultation_ended_at: appointment.consultation_ended_at?.toISOString() ?? null,
        patient: {
          id: appointment.patient.id,
          full_name: appointment.patient.full_name
        },
        doctor: {
          id: appointment.doctor.id,
          full_name: appointment.doctor.full_name,
          specialty: appointment.doctor.doctor_profile?.specialty ?? null,
          photo_url: appointment.doctor.doctor_profile?.photo_url ?? null,
          bio: appointment.doctor.doctor_profile?.bio ?? null,
          rating_average: appointment.doctor.doctor_profile?.rating_average ?? 0,
          years_experience: appointment.doctor.doctor_profile?.years_experience ?? 0
        }
      },
      consultationContext,
      isReadOnly
    };
  }

  async issuePrescription(
    appointmentId: string,
    doctorId: string,
    data: IssuePrescriptionDto
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, full_name: true } },
        doctor: { select: { id: true, full_name: true } }
      }
    });

    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    if (appointment.doctor_id !== doctorId) {
      throw new AppError("You are not the doctor for this appointment", 403, "FORBIDDEN");
    }

    if (appointment.status !== "in_session") {
      throw new AppError("Cannot issue prescription when consultation is not active", 400, "BAD_REQUEST");
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const todayCount = await prisma.prescription.count({
      where: {
        rx_reference: { startsWith: `RX-${todayStr}` }
      }
    });

    const rxReference = `RX-${todayStr}-${String(todayCount + 1).padStart(3, "0")}`;

    const maxSupplyDays = Math.max(...data.medications.map((m) => (m.is_ongoing ? 30 : m.supply_days)));

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
          notes: data.notes ?? null,
          expires_at: expiresAt
        }
      });

      const qrHash = crypto
        .createHmac("sha256", env.ENCRYPTION_KEY)
        .update(`${presc.id}:${appointment.patient_id}:${doctorId}`)
        .digest("hex");

      await tx.prescription.update({
        where: { id: presc.id },
        data: { qr_hash: qrHash }
      });

      for (const med of data.medications) {
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
            is_ongoing: med.is_ongoing,
            quantity: med.quantity ?? null
          }
        });
      }

      return tx.prescription.findUnique({
        where: { id: presc.id },
        include: { medications: true }
      });
    });

    const systemMsgText = `PRESCRIPTION_ISSUED:${prescription!.id}`;
    const { encrypted, iv } = encrypt(systemMsgText);

    await prisma.message.create({
      data: {
        conversation_id: appointmentId,
        appointment_id: appointmentId,
        sender_user_id: doctorId,
        recipient_user_id: appointment.patient_id,
        message_text: encrypted,
        message_iv: iv,
        message_type: "system",
        is_system_message: true
      }
    });

    await prisma.consultationSummary.upsert({
      where: { appointment_id: appointmentId },
      create: {
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        doctor_id: doctorId,
        prescription_issued: true,
        prescription_id: prescription!.id
      },
      update: {
        prescription_issued: true,
        prescription_id: prescription!.id
      }
    });

    await notificationService.send({
      userId: appointment.patient_id,
      type: "prescription_issued",
      title: "Prescription Issued",
      message: `Dr. ${appointment.doctor.full_name} issued a prescription — ${data.medications.length} medication(s)`,
      actionUrl: `/pharmacy?prescription=${prescription!.id}`,
      sendPush: true
    });

    return prescription;
  }

  async saveSummaryNote(appointmentId: string, doctorId: string, note: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { doctor_id: true, patient_id: true }
    });

    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    if (appointment.doctor_id !== doctorId) {
      throw new AppError("You are not the doctor for this appointment", 403, "FORBIDDEN");
    }

    await prisma.consultationSummary.upsert({
      where: { appointment_id: appointmentId },
      create: {
        appointment_id: appointmentId,
        patient_id: appointment.patient_id,
        doctor_id: doctorId,
        summary_note: note
      },
      update: {
        summary_note: note
      }
    });
  }

  async getSummary(appointmentId: string, requesterId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { patient_id: true, doctor_id: true }
    });

    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    if (appointment.patient_id !== requesterId && appointment.doctor_id !== requesterId) {
      throw new AppError("You are not authorized", 403, "FORBIDDEN");
    }

    const summary = await prisma.consultationSummary.findUnique({
      where: { appointment_id: appointmentId }
    });

    return summary;
  }

  async runMessageCleanup(): Promise<{ deleted: number }> {
    const retentionDaysStr = await systemSettings.get("message_retention_days");
    const retentionDays = parseInt(retentionDaysStr ?? "30", 10);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldMessages = await prisma.message.findMany({
      where: {
        sent_at: { lt: cutoffDate },
        deleted_at: null,
        is_system_message: false
      },
      select: { id: true, appointment_id: true }
    });

    if (oldMessages.length === 0) {
      logger.info("Message cleanup: no messages to delete");
      return { deleted: 0 };
    }

    const appointmentIds = [...new Set(oldMessages.map((m) => m.appointment_id))];

    for (const appId of appointmentIds) {
      const app = await prisma.appointment.findUnique({
        where: { id: appId },
        select: { patient_id: true, doctor_id: true }
      });
      if (app) {
        await prisma.consultationSummary.upsert({
          where: { appointment_id: appId },
          create: {
            appointment_id: appId,
            patient_id: app.patient_id,
            doctor_id: app.doctor_id
          },
          update: {}
        });
      }
    }

    const ids = oldMessages.map((m) => m.id);

    await prisma.message.updateMany({
      where: { id: { in: ids } },
      data: { deleted_at: new Date() }
    });

    logger.info(`Soft-deleted ${ids.length} messages older than ${retentionDays} days`);
    return { deleted: ids.length };
  }
}

export const consultationService = new ConsultationService();

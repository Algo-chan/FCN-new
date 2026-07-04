import type { AppointmentStatus, AppointmentType, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/app-error";
import { logger } from "../../utils/logger";
import { systemSettings } from "../../utils/system-settings";
import { chapaService } from "../payments/chapa.service";
import { notificationService } from "../notifications/notification.service";
import type { CreateAppointmentDto, RescheduleAppointmentDto } from "./appointments.validators";

interface AppointmentResult {
  id: string;
  patient_id: string;
  doctor_id: string;
  nurse_id: string | null;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  scheduled_at: Date;
  duration_minutes: number;
  chief_complaint: string | null;
  platform_fee_etb: number;
  payment_status: string;
  payment_tx_ref: string | null;
  chapa_checkout_url: string | null;
  reschedule_count: number;
  rescheduled_from: Date | null;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_by_role: string | null;
  actual_start_time: Date | null;
  actual_end_time: Date | null;
  created_at: Date;
  updated_at: Date;
  doctor?: { id: string; full_name: string; doctor_profile?: { specialty: string } | null };
  patient?: { id: string; full_name: string };
}

interface AppointmentListResult {
  appointments: AppointmentResult[];
  total: number;
  page: number;
  totalPages: number;
}

export class AppointmentsService {
  async createAppointment(patientId: string, dto: CreateAppointmentDto): Promise<AppointmentResult> {
    const { doctor_id, appointment_type, scheduled_at, duration_minutes, chief_complaint } = dto;
    const scheduledDate = new Date(scheduled_at);
    const now = new Date();

    if (scheduledDate <= now) {
      throw new AppError("Appointment must be scheduled in the future", 400, "PAST_DATE");
    }

    const doctor = await prisma.user.findUnique({
      where: { id: doctor_id },
      include: { doctor_profile: true }
    });

    if (!doctor || doctor.role !== "doctor" || doctor.status !== "active") {
      throw new AppError("Doctor not found or not available", 404, "DOCTOR_NOT_FOUND");
    }

    if (doctor.doctor_profile?.availability_status !== "available") {
      throw new AppError("Doctor is not currently available", 400, "DOCTOR_UNAVAILABLE");
    }

    const consultationFee = Number(doctor.doctor_profile?.consultation_fee_etb ?? 50);
    const platformFee = Math.round(consultationFee * 0.1);
    const totalFee = consultationFee + platformFee;

    const maxRescheduleCount = 3;
    const appointment = await prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM appointments
         WHERE doctor_id = $1
           AND status != 'cancelled'
           AND scheduled_at < $2::timestamptz + interval '1 minute' * $3
           AND scheduled_at + interval '1 minute' * $4 > $5::timestamptz
         FOR UPDATE`,
        doctor_id,
        scheduledDate,
        duration_minutes,
        duration_minutes,
        scheduledDate
      );

      if (existing.length > 0) {
        throw new AppError("This time slot is already booked", 409, "SLOT_CONFLICT");
      }

      const patient = await tx.user.findUnique({
        where: { id: patientId },
        select: { full_name: true, email: true }
      });

      const paymentEnabled = await systemSettings.isPaymentEnabled();
      const isFree = await systemSettings.isFreePeriod();
      const needsPayment = paymentEnabled && !isFree && totalFee > 0;

      let paymentTxRef: string | null = null;
      let checkoutUrl: string | null = null;

      const created = await tx.appointment.create({
        data: {
          patient_id: patientId,
          doctor_id,
          appointment_type,
          status: needsPayment ? "pending" : "confirmed",
          scheduled_at: scheduledDate,
          duration_minutes,
          chief_complaint: chief_complaint ?? null,
          platform_fee_etb: totalFee,
          payment_status: needsPayment ? "unpaid" : "paid",
          reschedule_count: 0
        }
      });

      if (needsPayment) {
        const chapaResult = await chapaService.initializePayment(
          created.id,
          totalFee,
          patient?.full_name ?? "Patient",
          patient?.email ?? "patient@fcn.health"
        );
        paymentTxRef = chapaResult.tx_ref;
        checkoutUrl = chapaResult.checkout_url;

        await tx.appointment.update({
          where: { id: created.id },
          data: {
            payment_tx_ref: paymentTxRef,
            chapa_checkout_url: checkoutUrl
          }
        });
      } else {
        paymentTxRef = `free-${created.id}`;
      }

      await tx.appointment.findUnique({
        where: { id: created.id }
      });

      return { ...created, payment_tx_ref: paymentTxRef, chapa_checkout_url: checkoutUrl };
    });

    await notificationService.appointmentCreated(
      patientId,
      doctor.full_name,
      scheduledDate
    );

    const result = await prisma.appointment.findUnique({
      where: { id: appointment.id },
      include: {
        doctor: {
          select: { id: true, full_name: true, doctor_profile: { select: { specialty: true } } }
        },
        patient: {
          select: { id: true, full_name: true }
        }
      }
    });

    if (!result) throw new AppError("Failed to create appointment", 500, "CREATE_FAILED");
    return this.mapAppointment(result);
  }

  async getPatientAppointments(patientId: string, status?: string, page = 1, limit = 12): Promise<AppointmentListResult> {
    const where: Prisma.AppointmentWhereInput = { patient_id: patientId };
    if (status) {
      where.status = status as AppointmentStatus;
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduled_at: "desc" },
        include: {
          doctor: {
            select: { id: true, full_name: true, doctor_profile: { select: { specialty: true } } }
          },
          patient: {
            select: { id: true, full_name: true }
          }
        }
      })
    ]);

    return {
      appointments: appointments.map((a) => this.mapAppointment(a)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getDoctorAppointments(doctorId: string, status?: string, page = 1, limit = 12): Promise<AppointmentListResult> {
    const where: Prisma.AppointmentWhereInput = { doctor_id: doctorId };
    if (status) {
      where.status = status as AppointmentStatus;
    }

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { scheduled_at: "desc" },
        include: {
          patient: { select: { id: true, full_name: true } },
          doctor: {
            select: { id: true, full_name: true, doctor_profile: { select: { specialty: true } } }
          }
        }
      })
    ]);

    return {
      appointments: appointments.map((a) => this.mapAppointment(a)),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async cancelAppointment(appointmentId: string, userId: string, userRole: string, reason?: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: { select: { full_name: true } }, patient: { select: { id: true } } }
    });

    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    const isPatient = appointment.patient_id === userId && userRole === "patient";
    const isDoctor = appointment.doctor_id === userId && userRole === "doctor";
    const isAdmin = ["hospital_admin", "super_admin"].includes(userRole);

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new AppError("You do not have permission to cancel this appointment", 403, "FORBIDDEN");
    }

    const cancellableStatuses: AppointmentStatus[] = ["pending", "confirmed", "scheduled"];
    if (!cancellableStatuses.includes(appointment.status as AppointmentStatus)) {
      throw new AppError("This appointment cannot be cancelled in its current state", 400, "INVALID_STATUS");
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "cancelled",
        cancellation_reason: reason ?? null,
        cancelled_by: userId,
        cancelled_by_role: userRole
      }
    });

    if (appointment.payment_status === "paid") {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { payment_status: "refunded" }
      });
    }

    await notificationService.appointmentCancelled(
      appointment.patient_id,
      appointment.doctor_id,
      appointment.doctor.full_name,
      appointment.scheduled_at
    );
  }

  async rescheduleAppointment(appointmentId: string, userId: string, userRole: string, dto: RescheduleAppointmentDto): Promise<AppointmentResult> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: { select: { full_name: true } } }
    });

    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    const isPatient = appointment.patient_id === userId && userRole === "patient";
    const isDoctor = appointment.doctor_id === userId && userRole === "doctor";

    if (!isPatient && !isDoctor) {
      throw new AppError("You do not have permission to reschedule this appointment", 403, "FORBIDDEN");
    }

    const reschedulableStatuses: AppointmentStatus[] = ["pending", "confirmed", "scheduled"];
    if (!reschedulableStatuses.includes(appointment.status as AppointmentStatus)) {
      throw new AppError("This appointment cannot be rescheduled in its current state", 400, "INVALID_STATUS");
    }

    const maxReschedule = 3;
    if (appointment.reschedule_count >= maxReschedule) {
      throw new AppError(`Maximum reschedule limit (${maxReschedule}) reached`, 400, "MAX_RESCHEDULE");
    }

    const newDate = new Date(dto.new_scheduled_at);
    if (newDate <= new Date()) {
      throw new AppError("New appointment time must be in the future", 400, "PAST_DATE");
    }

    const oldDate = appointment.scheduled_at;

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM appointments
         WHERE doctor_id = $1
           AND id != $2
           AND status != 'cancelled'
           AND scheduled_at < $3::timestamptz + interval '1 minute' * $4
           AND scheduled_at + interval '1 minute' * $5 > $6::timestamptz
         FOR UPDATE`,
        appointment.doctor_id,
        appointmentId,
        newDate,
        appointment.duration_minutes,
        appointment.duration_minutes,
        newDate
      );

      if (existing.length > 0) {
        throw new AppError("This time slot is already booked", 409, "SLOT_CONFLICT");
      }

      await tx.appointmentRescheduleHistory.create({
        data: {
          appointment_id: appointmentId,
          old_scheduled_at: oldDate,
          new_scheduled_at: newDate,
          rescheduled_by: userId,
          reason: dto.reason ?? null
        }
      });

      return tx.appointment.update({
        where: { id: appointmentId },
        data: {
          scheduled_at: newDate,
          rescheduled_from: oldDate,
          reschedule_count: { increment: 1 },
          status: "confirmed"
        }
      });
    });

    await notificationService.appointmentRescheduled(
      appointment.patient_id,
      appointment.doctor_id,
      appointment.doctor.full_name,
      oldDate,
      newDate
    );

    const result = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { id: true, full_name: true, doctor_profile: { select: { specialty: true } } } },
        patient: { select: { id: true, full_name: true } }
      }
    });

    if (!result) throw new AppError("Failed to reschedule appointment", 500, "UPDATE_FAILED");
    return this.mapAppointment(result);
  }

  async getAppointmentById(appointmentId: string): Promise<AppointmentResult> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { id: true, full_name: true, doctor_profile: { select: { specialty: true } } } },
        patient: { select: { id: true, full_name: true } },
        reschedule_history: { orderBy: { rescheduled_at: "desc" } },
        payment_logs: { orderBy: { created_at: "desc" } }
      }
    });

    if (!appointment) {
      throw new AppError("Appointment not found", 404, "NOT_FOUND");
    }

    return this.mapAppointment(appointment);
  }

  async startAppointment(appointmentId: string, doctorId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });

    if (!appointment) throw new AppError("Appointment not found", 404, "NOT_FOUND");
    if (appointment.doctor_id !== doctorId) throw new AppError("Not your appointment", 403, "FORBIDDEN");

    const startableStatuses: AppointmentStatus[] = ["confirmed", "scheduled"];
    if (!startableStatuses.includes(appointment.status as AppointmentStatus)) {
      throw new AppError("Appointment cannot be started in its current state", 400, "INVALID_STATUS");
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "in_session",
        actual_start_time: new Date()
      }
    });

    await prisma.doctorProfile.update({
      where: { user_id: doctorId },
      data: { availability_status: "in_session" }
    });
  }

  async completeAppointment(appointmentId: string, doctorId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });

    if (!appointment) throw new AppError("Appointment not found", 404, "NOT_FOUND");
    if (appointment.doctor_id !== doctorId) throw new AppError("Not your appointment", 403, "FORBIDDEN");

    if (appointment.status !== "in_session") {
      throw new AppError("Only in-session appointments can be completed", 400, "INVALID_STATUS");
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "completed",
        actual_end_time: new Date()
      }
    });

    await prisma.doctorProfile.update({
      where: { user_id: doctorId },
      data: { availability_status: "available" }
    });
  }

  private mapAppointment(a: any): AppointmentResult {
    return {
      id: a.id,
      patient_id: a.patient_id,
      doctor_id: a.doctor_id,
      nurse_id: a.nurse_id,
      appointment_type: a.appointment_type,
      status: a.status,
      scheduled_at: a.scheduled_at,
      duration_minutes: a.duration_minutes,
      chief_complaint: a.chief_complaint,
      platform_fee_etb: Number(a.platform_fee_etb),
      payment_status: a.payment_status,
      payment_tx_ref: a.payment_tx_ref,
      chapa_checkout_url: a.chapa_checkout_url,
      reschedule_count: a.reschedule_count,
      rescheduled_from: a.rescheduled_from,
      cancellation_reason: a.cancellation_reason,
      cancelled_by: a.cancelled_by,
      cancelled_by_role: a.cancelled_by_role,
      actual_start_time: a.actual_start_time,
      actual_end_time: a.actual_end_time,
      created_at: a.created_at,
      updated_at: a.updated_at,
      doctor: a.doctor ? { id: a.doctor.id, full_name: a.doctor.full_name, doctor_profile: a.doctor.doctor_profile ? { specialty: a.doctor.doctor_profile.specialty } : null } : undefined,
      patient: a.patient ? { id: a.patient.id, full_name: a.patient.full_name } : undefined
    };
  }
}

export const appointmentsService = new AppointmentsService();

import { prisma } from "../../config/database";
import { getIO } from "../../socket";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/app-error";

export interface QueueEntry {
  patientId: string;
  patientName: string;
  chiefComplaint?: string;
  allergies?: string;
  requestedAt: number;
}

// In-memory instant consult queue with Redis synchronization support
const instantQueue: QueueEntry[] = [];

export class InstantConsultService {
  /**
   * Request an instant consultation.
   * If an active doctor is available, match immediately and alert doctor.
   * If none available, place patient into the instant queue.
   */
  async requestInstantConsult(patientId: string, chiefComplaint?: string, allergies?: string) {
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { id: true, full_name: true, phone: true }
    });

    if (!patient) {
      throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND");
    }

    // Check if patient already has an active in_session or pending instant appointment
    const existingActive = await prisma.appointment.findFirst({
      where: {
        patient_id: patientId,
        status: { in: ["confirmed", "in_session"] },
        appointment_type: "remote",
        created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) } // within last 1 hour
      },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            doctor_profile: {
              select: {
                specialty: true,
                rating_average: true,
                rating_count: true,
                photo_url: true,
                years_experience: true,
                city: true
              }
            }
          }
        }
      }
    });

    if (existingActive) {
      return {
        available: true,
        appointmentId: existingActive.id,
        doctor: existingActive.doctor,
        estimatedWait: 0,
        status: existingActive.status
      };
    }

    // 1. Look for available active doctors
    const availableDoctors = await prisma.user.findMany({
      where: {
        role: "doctor",
        status: "active",
        doctor_profile: {
          availability_status: "available"
        }
      },
      include: {
        doctor_profile: true
      },
      orderBy: {
        doctor_profile: {
          rating_average: "desc"
        }
      }
    });

    if (availableDoctors.length > 0) {
      // Pick best candidate doctor
      const matchedDoctor = availableDoctors[0];

      // Create appointment immediately in confirmed status
      const now = new Date();
      const fee = Number(matchedDoctor.doctor_profile?.consultation_fee_etb ?? 50);

      const appointment = await prisma.appointment.create({
        data: {
          patient_id: patientId,
          doctor_id: matchedDoctor.id,
          appointment_type: "remote",
          status: "confirmed",
          scheduled_at: now,
          duration_minutes: 15,
          chief_complaint: chiefComplaint || "Instant Consultation Request",
          platform_fee_etb: fee,
          payment_status: "paid"
        },
        include: {
          doctor: {
            select: {
              id: true,
              full_name: true,
              doctor_profile: {
                select: {
                  specialty: true,
                  rating_average: true,
                  rating_count: true,
                  photo_url: true,
                  years_experience: true,
                  city: true
                }
              }
            }
          },
          patient: {
            select: {
              id: true,
              full_name: true,
              phone: true
            }
          }
        }
      });

      // Notify matched doctor in real-time via Socket.io
      try {
        const io = getIO();
        if (io) {
          io.to(`user:${matchedDoctor.id}`).emit("instant_consult_incoming", {
            appointmentId: appointment.id,
            patient: appointment.patient,
            chiefComplaint: chiefComplaint || "Immediate medical assistance requested",
            allergies: allergies || null,
            requestedAt: now.toISOString()
          });

          // Also notify patient socket that doctor was found
          io.to(`user:${patientId}`).emit("doctor_accepted", {
            appointmentId: appointment.id,
            doctor: appointment.doctor
          });
        }
      } catch (err) {
        logger.warn("Socket notification to doctor failed", { error: err });
      }

      // Remove patient from queue if they were previously queued
      this.removeFromQueue(patientId);

      return {
        available: true,
        appointmentId: appointment.id,
        doctor: appointment.doctor,
        estimatedWait: 0
      };
    }

    // 2. No doctor immediately available -> add to queue
    let queueIndex = instantQueue.findIndex((q) => q.patientId === patientId);
    if (queueIndex === -1) {
      instantQueue.push({
        patientId,
        patientName: patient.full_name,
        chiefComplaint,
        allergies,
        requestedAt: Date.now()
      });
      queueIndex = instantQueue.length - 1;
    }

    const queuePosition = queueIndex + 1;
    const estimatedWait = Math.max(5, queuePosition * 5);

    // Fetch next doctors to showcase on fallback screen
    const nextAvailable = await prisma.user.findMany({
      where: {
        role: "doctor",
        status: "active"
      },
      take: 3,
      select: {
        id: true,
        full_name: true,
        doctor_profile: {
          select: {
            specialty: true,
            rating_average: true,
            photo_url: true,
            city: true
          }
        }
      },
      orderBy: {
        doctor_profile: {
          rating_average: "desc"
        }
      }
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`user:${patientId}`).emit("no_doctors_available", {
          queuePosition,
          estimatedWait,
          nextAvailable
        });
      }
    } catch {
      // Socket might not be connected yet
    }

    return {
      available: false,
      queuePosition,
      estimatedWait,
      nextAvailable
    };
  }

  /**
   * Doctor accepts the instant consultation request.
   */
  async acceptInstantConsult(doctorId: string, appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: {
          select: {
            id: true,
            full_name: true,
            doctor_profile: {
              select: {
                specialty: true,
                rating_average: true,
                photo_url: true
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            full_name: true
          }
        }
      }
    });

    if (!appointment || appointment.doctor_id !== doctorId) {
      throw new AppError("Appointment not found or unauthorized", 404, "APPOINTMENT_NOT_FOUND");
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "in_session",
          consultation_started_at: now,
          actual_start_time: now
        }
      }),
      prisma.doctorProfile.update({
        where: { user_id: doctorId },
        data: { availability_status: "in_session" }
      })
    ]);

    try {
      const io = getIO();
      if (io) {
        // Emit consultation_ready to both patient and doctor
        io.to(`user:${appointment.patient_id}`).emit("consultation_ready", {
          appointmentId,
          doctor: appointment.doctor
        });
        io.to(`user:${doctorId}`).emit("consultation_ready", {
          appointmentId
        });
      }
    } catch (err) {
      logger.warn("Socket notification in accept failed", { error: err });
    }

    return { success: true, appointmentId };
  }

  /**
   * Doctor declines instant consult -> reassign to next doctor or queue.
   */
  async declineInstantConsult(doctorId: string, appointmentId: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) return { success: false };

    // Try finding another available doctor
    const otherDoctor = await prisma.user.findFirst({
      where: {
        role: "doctor",
        status: "active",
        id: { not: doctorId },
        doctor_profile: { availability_status: "available" }
      },
      include: { doctor_profile: true }
    });

    if (otherDoctor) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { doctor_id: otherDoctor.id }
      });

      try {
        const io = getIO();
        if (io) {
          io.to(`user:${otherDoctor.id}`).emit("instant_consult_incoming", {
            appointmentId,
            patientId: appointment.patient_id,
            chiefComplaint: appointment.chief_complaint
          });
        }
      } catch (err) {
        logger.warn("Socket notification reassign error", { error: err });
      }
      return { reallocated: true };
    }

    // Cancel appointment and add to queue
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "cancelled", cancellation_reason: "Doctor unavailable" }
    });

    return this.requestInstantConsult(
      appointment.patient_id,
      appointment.chief_complaint ?? undefined
    );
  }

  /**
   * Cancel instant consultation request or leave queue.
   */
  async cancelInstantConsult(patientId: string, appointmentId?: string) {
    this.removeFromQueue(patientId);

    if (appointmentId) {
      await prisma.appointment.updateMany({
        where: {
          id: appointmentId,
          patient_id: patientId,
          status: { in: ["pending", "confirmed"] }
        },
        data: {
          status: "cancelled",
          cancellation_reason: "Cancelled by patient"
        }
      });
    }

    this.broadcastQueueUpdates();
    return { success: true };
  }

  /**
   * Get current queue position for a patient.
   */
  getQueueStatus(patientId: string) {
    const index = instantQueue.findIndex((q) => q.patientId === patientId);
    if (index === -1) {
      return { inQueue: false, queuePosition: 0, estimatedWait: 0 };
    }
    const queuePosition = index + 1;
    const estimatedWait = Math.max(5, queuePosition * 5);
    return { inQueue: true, queuePosition, estimatedWait };
  }

  private removeFromQueue(patientId: string) {
    const idx = instantQueue.findIndex((q) => q.patientId === patientId);
    if (idx !== -1) {
      instantQueue.splice(idx, 1);
    }
  }

  private broadcastQueueUpdates() {
    try {
      const io = getIO();
      if (!io) return;
      instantQueue.forEach((entry, idx) => {
        const position = idx + 1;
        const wait = Math.max(5, position * 5);
        io.to(`user:${entry.patientId}`).emit("queue_update", {
          queuePosition: position,
          estimatedWait: wait
        });
      });
    } catch (err) {
      logger.warn("Broadcast queue updates error", { error: err });
    }
  }
}

export const instantConsultService = new InstantConsultService();

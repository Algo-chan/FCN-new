import crypto from "crypto";
import QRCode from "qrcode";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { systemSettings } from "../../utils/system-settings";
import { notificationService } from "../notifications/notification.service";
import { AppError } from "../../utils/app-error";
import { logger } from "../../utils/logger";
import bcrypt from "bcrypt";

interface PrescriptionWithMedications {
  id: string;
  rx_reference: string;
  patient_id: string;
  doctor_id: string;
  status: string;
  qr_hash: string;
  notes: string | null;
  issued_at: Date;
  expires_at: Date;
  refill_count: number;
  max_refills: number;
  dispensed_at: Date | null;
  dispensed_by_pharmacy_id: string | null;
  dispense_count: number;
  medications: Array<{
    id: string;
    drug_name: string;
    strength: string;
    form: string | null;
    instructions: string;
    supply_days: number;
    is_ongoing: boolean;
    reminder_enabled: boolean;
  }>;
  doctor_name: string;
  doctor_specialty: string;
}

interface PrescriptionDetail extends PrescriptionWithMedications {
  dispense_records: Array<{
    id: string;
    pharmacy_id: string;
    pharmacy_name?: string;
    dispensed_by: string;
    dispensed_at: Date;
    notes: string | null;
    medications_dispensed: string[];
  }>;
  refill_requests: Array<{
    id: string;
    status: string;
    patient_note: string | null;
    doctor_note: string | null;
    new_prescription_id: string | null;
    requested_at: Date;
    responded_at: Date | null;
  }>;
}

interface PrescriptionVerificationResult {
  valid: boolean;
  reason?: string;
  prescription?: {
    id: string;
    rx_reference: string;
    patient_name: string;
    doctor_name: string;
    issued_at: Date;
    expires_at: Date;
    status: string;
    medications: Array<{
      drug_name: string;
      strength: string;
      form: string | null;
      instructions: string;
      supply_days: number;
      is_ongoing: boolean;
    }>;
  };
  message?: string;
}

class PharmacyService {
  async getMyPrescriptions(patientId: string): Promise<PrescriptionWithMedications[]> {
    await this.updatePrescriptionStatuses(patientId);

    const prescriptions = await prisma.prescription.findMany({
      where: { patient_id: patientId },
      include: {
        medications: {
          select: {
            id: true,
            drug_name: true,
            strength: true,
            form: true,
            instructions: true,
            supply_days: true,
            is_ongoing: true,
            reminder_enabled: true
          }
        },
        doctor: {
          select: {
            full_name: true,
            doctor_profile: { select: { specialty: true } }
          }
        }
      },
      orderBy: [
        { status: "asc" },
        { issued_at: "desc" }
      ]
    });

    const statusPriority: Record<string, number> = {
      active: 0,
      refill_due: 1,
      dispensed: 2,
      expired: 3,
      cancelled: 4
    };

    return prescriptions
      .map((p) => ({
        id: p.id,
        rx_reference: p.rx_reference,
        patient_id: p.patient_id,
        doctor_id: p.doctor_id,
        status: p.status,
        qr_hash: p.qr_hash,
        notes: p.notes,
        issued_at: p.issued_at,
        expires_at: p.expires_at,
        refill_count: p.refill_count,
        max_refills: p.max_refills,
        dispensed_at: p.dispensed_at,
        dispensed_by_pharmacy_id: p.dispensed_by_pharmacy_id,
        dispense_count: p.dispense_count,
        medications: p.medications,
        doctor_name: p.doctor.full_name,
        doctor_specialty: p.doctor.doctor_profile?.specialty ?? "General"
      }))
      .sort((a, b) => (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99));
  }

  async updatePrescriptionStatuses(patientId: string): Promise<void> {
    const now = new Date();

    const expiredPrescriptions = await prisma.prescription.findMany({
      where: {
        patient_id: patientId,
        expires_at: { lt: now },
        status: { notIn: ["expired", "cancelled", "dispensed"] }
      },
      include: {
        medications: { select: { drug_name: true } }
      }
    });

    for (const prescription of expiredPrescriptions) {
      await prisma.prescription.update({
        where: { id: prescription.id },
        data: { status: "expired" }
      });
      logger.info(`Prescription ${prescription.rx_reference} auto-expired`);
    }

    const refillDuePrescriptions = await prisma.prescription.findMany({
      where: {
        patient_id: patientId,
        status: "active",
        expires_at: { gte: now }
      },
      include: {
        medications: { select: { drug_name: true, is_ongoing: true } }
      }
    });

    for (const prescription of refillDuePrescriptions) {
      const daysRemaining = Math.ceil(
        (prescription.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysRemaining <= 5 && prescription.medications.some((m) => !m.is_ongoing)) {
        await prisma.prescription.update({
          where: { id: prescription.id },
          data: { status: "refill_due" }
        });

        const nonOngoingMeds = prescription.medications.filter((m) => !m.is_ongoing);
        const drugNames = nonOngoingMeds.map((m) => m.drug_name).join(", ");

        const existingNotification = await prisma.notification.findFirst({
          where: {
            user_id: patientId,
            reference_id: prescription.id,
            type: "medication_low",
            created_at: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
            }
          }
        });

        if (!existingNotification) {
          await notificationService.send({
            userId: patientId,
            type: "medication_low",
            title: "Refill Due",
            message: `\u{1F48A} ${drugNames} is running low \u2014 ${daysRemaining} days remaining`,
            actionUrl: `/pharmacy?prescription=${prescription.id}`,
            referenceId: prescription.id,
            sendPush: true
          });
        }
      }
    }
  }

  async getPrescriptionById(
    id: string,
    requesterId: string,
    requesterRole: string
  ): Promise<PrescriptionDetail> {
    const prescription = await prisma.prescription.findUnique({
      where: { id },
      include: {
        medications: {
          select: {
            id: true,
            drug_name: true,
            strength: true,
            form: true,
            instructions: true,
            supply_days: true,
            is_ongoing: true,
            reminder_enabled: true
          }
        },
        doctor: {
          select: {
            full_name: true,
            doctor_profile: { select: { specialty: true } }
          }
        },
        dispense_records: {
          include: { pharmacy: { select: { name: true } } },
          orderBy: { dispensed_at: "desc" }
        },
        refill_requests: {
          orderBy: { requested_at: "desc" }
        }
      }
    });

    if (!prescription) {
      throw new AppError("Prescription not found", 404, "NOT_FOUND");
    }

    if (requesterRole === "patient" && prescription.patient_id !== requesterId) {
      throw new AppError("Access denied", 403, "FORBIDDEN");
    }

    if (requesterRole === "doctor" && prescription.doctor_id !== requesterId) {
      throw new AppError("Access denied", 403, "FORBIDDEN");
    }

    return {
      id: prescription.id,
      rx_reference: prescription.rx_reference,
      patient_id: prescription.patient_id,
      doctor_id: prescription.doctor_id,
      status: prescription.status,
      qr_hash: prescription.qr_hash,
      notes: prescription.notes,
      issued_at: prescription.issued_at,
      expires_at: prescription.expires_at,
      refill_count: prescription.refill_count,
      max_refills: prescription.max_refills,
      dispensed_at: prescription.dispensed_at,
      dispensed_by_pharmacy_id: prescription.dispensed_by_pharmacy_id,
      dispense_count: prescription.dispense_count,
      medications: prescription.medications,
      doctor_name: prescription.doctor.full_name,
      doctor_specialty: prescription.doctor.doctor_profile?.specialty ?? "General",
      dispense_records: prescription.dispense_records.map((dr) => ({
        id: dr.id,
        pharmacy_id: dr.pharmacy_id,
        pharmacy_name: dr.pharmacy.name,
        dispensed_at: dr.dispensed_at,
        dispensed_by: dr.dispensed_by,
        notes: dr.notes,
        medications_dispensed: dr.medications_dispensed
      })),
      refill_requests: prescription.refill_requests.map((rr) => ({
        id: rr.id,
        status: rr.status,
        patient_note: rr.patient_note,
        doctor_note: rr.doctor_note,
        new_prescription_id: rr.new_prescription_id,
        requested_at: rr.requested_at,
        responded_at: rr.responded_at
      }))
    };
  }

  async generateQRCode(
    prescriptionId: string,
    patientId: string
  ): Promise<{ qrDataUrl: string; qrHash: string }> {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { patient: { select: { full_name: true } } }
    });

    if (!prescription) {
      throw new AppError("Prescription not found", 404, "NOT_FOUND");
    }

    if (prescription.patient_id !== patientId) {
      throw new AppError("Access denied", 403, "FORBIDDEN");
    }

    if (prescription.status === "expired") {
      throw new AppError("Prescription has expired", 400, "PRESCRIPTION_EXPIRED");
    }

    if (prescription.status === "cancelled") {
      throw new AppError("Prescription has been cancelled", 400, "PRESCRIPTION_CANCELLED");
    }

    const qrDataUrl = await QRCode.toDataURL(
      JSON.stringify({
        rx: prescription.rx_reference,
        hash: prescription.qr_hash,
        patient: patientId,
        issued: prescription.issued_at.toISOString(),
        expires: prescription.expires_at.toISOString()
      }),
      {
        width: 300,
        margin: 2,
        color: {
          dark: "#0D1B3E",
          light: "#FFFFFF"
        },
        errorCorrectionLevel: "H"
      }
    );

    return { qrDataUrl, qrHash: prescription.qr_hash };
  }

  async verifyQR(
    qrHashOrRxRef: string,
    isRxRef: boolean,
    pharmacyId: string,
    scopedPharmacyId: string | null
  ): Promise<PrescriptionVerificationResult> {
    if (scopedPharmacyId !== null && pharmacyId !== scopedPharmacyId) {
      throw new AppError("Cannot verify prescriptions for another pharmacy", 403, "SCOPE_MISMATCH");
    }

    const prescription = isRxRef
      ? await prisma.prescription.findUnique({
          where: { rx_reference: qrHashOrRxRef },
          include: {
            patient: { select: { full_name: true } },
            doctor: { select: { full_name: true } },
            medications: {
              select: {
                drug_name: true,
                strength: true,
                form: true,
                instructions: true,
                supply_days: true,
                is_ongoing: true
              }
            }
          }
        })
      : await prisma.prescription.findUnique({
          where: { qr_hash: qrHashOrRxRef },
          include: {
            patient: { select: { full_name: true } },
            doctor: { select: { full_name: true } },
            medications: {
              select: {
                drug_name: true,
                strength: true,
                form: true,
                instructions: true,
                supply_days: true,
                is_ongoing: true
              }
            }
          }
        });

    if (!prescription) {
      return { valid: false, reason: "not_found" };
    }

    if (prescription.status === "expired") {
      return {
        valid: false,
        reason: "expired",
        prescription: {
          id: prescription.id,
          rx_reference: prescription.rx_reference,
          patient_name: prescription.patient.full_name,
          doctor_name: prescription.doctor.full_name,
          issued_at: prescription.issued_at,
          expires_at: prescription.expires_at,
          status: prescription.status,
          medications: prescription.medications
        },
        message: "This prescription has expired. Patient must request a refill from their doctor."
      };
    }

    if (prescription.status === "cancelled") {
      return {
        valid: false,
        reason: "cancelled",
        prescription: {
          id: prescription.id,
          rx_reference: prescription.rx_reference,
          patient_name: prescription.patient.full_name,
          doctor_name: prescription.doctor.full_name,
          issued_at: prescription.issued_at,
          expires_at: prescription.expires_at,
          status: prescription.status,
          medications: prescription.medications
        }
      };
    }

    if (prescription.dispense_count >= prescription.max_refills + 1) {
      return {
        valid: false,
        reason: "already_dispensed",
        prescription: {
          id: prescription.id,
          rx_reference: prescription.rx_reference,
          patient_name: prescription.patient.full_name,
          doctor_name: prescription.doctor.full_name,
          issued_at: prescription.issued_at,
          expires_at: prescription.expires_at,
          status: prescription.status,
          medications: prescription.medications
        }
      };
    }

    const expectedHash = crypto
      .createHmac("sha256", env.ENCRYPTION_KEY)
      .update(`${prescription.id}:${prescription.patient_id}:${prescription.doctor_id}`)
      .digest("hex");

    if (prescription.qr_hash !== expectedHash) {
      logger.warn(`QR hash mismatch for prescription ${prescription.rx_reference}`);
      if (!isRxRef) {
        return { valid: false, reason: "invalid_hash" };
      }
    }

    return {
      valid: true,
      prescription: {
        id: prescription.id,
        rx_reference: prescription.rx_reference,
        patient_name: prescription.patient.full_name,
        doctor_name: prescription.doctor.full_name,
        issued_at: prescription.issued_at,
        expires_at: prescription.expires_at,
        status: prescription.status,
        medications: prescription.medications
      }
    };
  }

  async dispensePrescription(
    prescriptionId: string,
    pharmacyId: string,
    dispensedBy: string,
    medicationsDispensed: string[],
    notes?: string,
    scopedPharmacyId?: string | null
  ) {
    if (scopedPharmacyId !== null && scopedPharmacyId !== undefined && pharmacyId !== scopedPharmacyId) {
      throw new AppError("Cannot dispense for another pharmacy", 403, "SCOPE_MISMATCH");
    }

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { name: true }
    });

    if (!pharmacy) {
      throw new AppError("Pharmacy not found", 404, "NOT_FOUND");
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: { select: { full_name: true, id: true } },
        doctor: { select: { full_name: true } },
        medications: { select: { drug_name: true } }
      }
    });

    if (!prescription) {
      throw new AppError("Prescription not found", 404, "NOT_FOUND");
    }

    if (prescription.status === "expired") {
      throw new AppError("Prescription has expired", 400, "PRESCRIPTION_EXPIRED");
    }

    if (prescription.status === "cancelled") {
      throw new AppError("Prescription has been cancelled", 400, "PRESCRIPTION_CANCELLED");
    }

    const dispenseRecord = await prisma.$transaction(async (tx) => {
      const record = await tx.dispenseRecord.create({
        data: {
          prescription_id: prescriptionId,
          pharmacy_id: pharmacyId,
          dispensed_by: dispensedBy,
          notes: notes ?? null,
          medications_dispensed: medicationsDispensed
        }
      });

      const newDispenseCount = prescription.dispense_count + 1;
      const allMedicationsDispensed = medicationsDispensed.length >= prescription.medications.length;
      const isLastDispense = newDispenseCount >= prescription.max_refills;

      await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          dispensed_at: new Date(),
          dispensed_by_pharmacy_id: pharmacyId,
          dispense_count: newDispenseCount,
          ...(isLastDispense && allMedicationsDispensed ? { status: "dispensed" } : {})
        }
      });

      return record;
    });

    await notificationService.send({
      userId: prescription.patient.id,
      type: "prescription_dispensed",
      title: "Prescription Dispensed",
      message: `\u2705 Your prescription ${prescription.rx_reference} has been dispensed at ${pharmacy.name}. Feel better soon!`,
      actionUrl: "/pharmacy",
      referenceId: prescriptionId,
      sendPush: true
    });

    logger.info(`Prescription ${prescription.rx_reference} dispensed at pharmacy ${pharmacyId}`);

    return dispenseRecord;
  }

  async createRefillRequest(
    patientId: string,
    prescriptionId: string,
    patientNote?: string
  ) {
    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        doctor: { select: { full_name: true, id: true } },
        medications: { select: { drug_name: true } }
      }
    });

    if (!prescription) {
      throw new AppError("Prescription not found", 404, "NOT_FOUND");
    }

    if (prescription.patient_id !== patientId) {
      throw new AppError("Access denied", 403, "FORBIDDEN");
    }

    if (prescription.refill_count >= prescription.max_refills) {
      throw new AppError("Maximum refills reached. Please book a new consultation.", 400, "MAX_REFILLS_REACHED");
    }

    const existingPending = await prisma.refillRequest.findFirst({
      where: {
        prescription_id: prescriptionId,
        patient_id: patientId,
        status: "PENDING"
      }
    });

    if (existingPending) {
      throw new AppError("A pending refill request already exists for this prescription", 400, "DUPLICATE_REQUEST");
    }

    const refillRequest = await prisma.refillRequest.create({
      data: {
        prescription_id: prescriptionId,
        patient_id: patientId,
        doctor_id: prescription.doctor_id,
        patient_note: patientNote ?? null
      }
    });

    const drugNames = prescription.medications.map((m) => m.drug_name).join(", ");
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { full_name: true }
    });

    await notificationService.send({
      userId: prescription.doctor.id,
      type: "refill_requested",
      title: "Refill Request Received",
      message: `${patient?.full_name ?? "A patient"} has requested a refill for ${drugNames}. Review in your prescriptions page.`,
      actionUrl: "/prescriptions",
      referenceId: refillRequest.id,
      sendPush: true
    });

    return refillRequest;
  }

  async respondToRefillRequest(
    requestId: string,
    doctorId: string,
    status: "APPROVED" | "DECLINED",
    doctorNote?: string
  ) {
    const refillRequest = await prisma.refillRequest.findUnique({
      where: { id: requestId },
      include: {
        prescription: {
          include: {
            medications: true,
            patient: { select: { full_name: true, id: true } },
            doctor: { select: { full_name: true } }
          }
        }
      }
    });

    if (!refillRequest) {
      throw new AppError("Refill request not found", 404, "NOT_FOUND");
    }

    if (refillRequest.prescription.doctor_id !== doctorId) {
      throw new AppError("Access denied", 403, "FORBIDDEN");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status,
        doctor_note: doctorNote ?? null,
        responded_at: new Date()
      };

      if (status === "APPROVED") {
        const newRxRef = await this.generateRxReference();

        const newPrescription = await tx.prescription.create({
          data: {
            rx_reference: newRxRef,
            patient_id: refillRequest.prescription.patient_id,
            doctor_id: doctorId,
            qr_hash: "",
            notes: refillRequest.prescription.notes,
            issued_at: new Date(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            refill_count: 0,
            max_refills: refillRequest.prescription.max_refills,
            medications: {
              create: refillRequest.prescription.medications.map((med) => ({
                drug_name: med.drug_name,
                strength: med.strength,
                form: med.form,
                instructions: med.instructions,
                frequency_per_day: med.frequency_per_day,
                reminder_times: med.reminder_times,
                supply_days: med.supply_days,
                is_ongoing: med.is_ongoing,
                quantity: med.quantity
              }))
            }
          }
        });

        const newQrHash = crypto
          .createHmac("sha256", env.ENCRYPTION_KEY)
          .update(`${newPrescription.id}:${refillRequest.prescription.patient_id}:${doctorId}`)
          .digest("hex");

        await tx.prescription.update({
          where: { id: newPrescription.id },
          data: { qr_hash: newQrHash }
        });

        await tx.prescription.update({
          where: { id: refillRequest.prescription_id },
          data: { refill_count: { increment: 1 } }
        });

        updateData.new_prescription_id = newPrescription.id;
      }

      return tx.refillRequest.update({
        where: { id: requestId },
        data: updateData
      });
    });

    if (status === "APPROVED") {
      await notificationService.send({
        userId: refillRequest.prescription.patient.id,
        type: "refill_approved",
        title: "Refill Approved",
        message: `\u2705 Dr. ${refillRequest.prescription.doctor.full_name} approved your refill request. Your new prescription is ready.`,
        actionUrl: "/pharmacy",
        referenceId: updated.id,
        sendPush: true
      });
    } else {
      const noteText = doctorNote ? ` Note from Dr. ${refillRequest.prescription.doctor.full_name}: ${doctorNote}` : "";
      await notificationService.send({
        userId: refillRequest.prescription.patient.id,
        type: "refill_declined",
        title: "Refill Declined",
        message: `Your refill request was declined.${noteText} Please book a consultation if needed.`,
        actionUrl: "/appointments/book",
        referenceId: updated.id,
        sendPush: true
      });
    }

    return updated;
  }

  async getDoctorPrescriptions(doctorId: string) {
    const prescriptions = await prisma.prescription.findMany({
      where: { doctor_id: doctorId },
      include: {
        medications: {
          select: {
            id: true,
            drug_name: true,
            strength: true,
            form: true,
            instructions: true,
            supply_days: true,
            is_ongoing: true,
            reminder_enabled: true
          }
        },
        patient: {
          select: { full_name: true, id: true }
        }
      },
      orderBy: { issued_at: "desc" }
    });

    return prescriptions.map((p) => ({
      id: p.id,
      rx_reference: p.rx_reference,
      patient_id: p.patient_id,
      patient: p.patient,
      doctor_id: p.doctor_id,
      status: p.status,
      qr_hash: p.qr_hash,
      notes: p.notes,
      issued_at: p.issued_at,
      expires_at: p.expires_at,
      refill_count: p.refill_count,
      max_refills: p.max_refills,
      dispensed_at: p.dispensed_at,
      dispensed_by_pharmacy_id: p.dispensed_by_pharmacy_id,
      dispense_count: p.dispense_count,
      medications: p.medications
    }));
  }

  async getDoctorRefillRequests(doctorId: string) {
    return prisma.refillRequest.findMany({
      where: { doctor_id: doctorId },
      include: {
        prescription: {
          select: {
            rx_reference: true,
            medications: { select: { drug_name: true } }
          }
        },
        patient: { select: { full_name: true, id: true } }
      },
      orderBy: { requested_at: "desc" }
    });
  }

  async getPharmacies(filters?: { status?: string; near?: { lat: number; lng: number } }) {
    const where: any = {
      ...(filters?.status ? { status: filters.status } : { status: "ACTIVE" })
    };

    const pharmacies = await prisma.pharmacy.findMany({
      where,
      include: {
        hospital_links: {
          include: { hospital: { select: { name: true } } }
        }
      },
      orderBy: [
        { is_partner: "desc" },
        { name: "asc" }
      ]
    });

    const mapped = pharmacies.map((p) => {
      let distanceKm: number | null = null;

      if (filters?.near && p.lat && p.lng) {
        distanceKm = this.haversineDistance(
          filters.near.lat,
          filters.near.lng,
          Number(p.lat),
          Number(p.lng)
        );
      }

      return {
        id: p.id,
        name: p.name,
        location: p.location,
        lat: p.lat ? Number(p.lat) : null,
        lng: p.lng ? Number(p.lng) : null,
        phone: p.phone,
        email: p.email,
        opening_hours: p.opening_hours,
        license_number: p.license_number,
        status: p.status,
        is_partner: p.is_partner,
        distance_km: distanceKm ? Math.round(distanceKm * 100) / 100 : null,
        hospital_links: p.hospital_links.map((l) => ({
          hospital_id: l.hospital_id,
          hospital_name: l.hospital.name
        }))
      };
    });

    if (filters?.near) {
      mapped.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    }

    return mapped;
  }

  async getPharmacyById(id: string) {
    const pharmacy = await prisma.pharmacy.findUnique({
      where: { id },
      include: {
        hospital_links: {
          include: { hospital: { select: { name: true, id: true } } }
        }
      }
    });

    if (!pharmacy) {
      throw new AppError("Pharmacy not found", 404, "NOT_FOUND");
    }

    return {
      ...pharmacy,
      lat: pharmacy.lat ? Number(pharmacy.lat) : null,
      lng: pharmacy.lng ? Number(pharmacy.lng) : null,
      hospital_links: pharmacy.hospital_links.map((l) => ({
        hospital_id: l.hospital_id,
        hospital_name: l.hospital.name
      }))
    };
  }

  async createPharmacy(data: {
    name: string;
    location: string;
    lat?: number;
    lng?: number;
    phone?: string;
    email?: string;
    opening_hours?: string;
    license_number: string;
  }) {
    return prisma.pharmacy.create({
      data: {
        name: data.name,
        location: data.location,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        opening_hours: data.opening_hours ?? null,
        license_number: data.license_number
      }
    });
  }

  async updatePharmacy(id: string, data: any) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) {
      throw new AppError("Pharmacy not found", 404, "NOT_FOUND");
    }

    return prisma.pharmacy.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.lat !== undefined && { lat: data.lat }),
        ...(data.lng !== undefined && { lng: data.lng }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.opening_hours !== undefined && { opening_hours: data.opening_hours }),
        ...(data.license_number !== undefined && { license_number: data.license_number }),
        ...(data.is_partner !== undefined && { is_partner: data.is_partner })
      }
    });
  }

  async updatePharmacyStatus(id: string, status: string) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) {
      throw new AppError("Pharmacy not found", 404, "NOT_FOUND");
    }

    return prisma.pharmacy.update({
      where: { id },
      data: { status: status as any }
    });
  }

  async createPharmacyAdmin(
    data: { full_name: string; email: string; password: string },
    pharmacyId: string,
    createdBy: string
  ) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) {
      throw new AppError("Pharmacy not found", 404, "NOT_FOUND");
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError("A user with this email already exists", 409, "CONFLICT");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        full_name: data.full_name,
        email: data.email,
        password_hash: passwordHash,
        role: "pharmacy_admin",
        status: "active",
        email_verified: true
      }
    });

    await prisma.pharmacyAdminProfile.create({
      data: {
        user_id: user.id,
        pharmacy_id: pharmacyId,
        created_by: createdBy
      }
    });

    const { EmailService } = await import("../auth/email.service");
    const emailService = new EmailService();
    await emailService.sendHospitalAdminWelcomeEmail(data.email, data.full_name, pharmacy.name, data.password);

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async linkPharmacyToHospital(pharmacyId: string, hospitalId: string) {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) throw new AppError("Pharmacy not found", 404, "NOT_FOUND");

    const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    if (!hospital) throw new AppError("Hospital not found", 404, "NOT_FOUND");

    const existing = await prisma.hospitalPharmacyLink.findUnique({
      where: { hospital_id_pharmacy_id: { hospital_id: hospitalId, pharmacy_id: pharmacyId } }
    });

    if (existing) {
      throw new AppError("Link already exists", 409, "CONFLICT");
    }

    return prisma.hospitalPharmacyLink.create({
      data: {
        hospital_id: hospitalId,
        pharmacy_id: pharmacyId
      }
    });
  }

  async unlinkPharmacyFromHospital(pharmacyId: string, hospitalId: string) {
    const link = await prisma.hospitalPharmacyLink.findUnique({
      where: { hospital_id_pharmacy_id: { hospital_id: hospitalId, pharmacy_id: pharmacyId } }
    });

    if (!link) {
      throw new AppError("Link not found", 404, "NOT_FOUND");
    }

    await prisma.hospitalPharmacyLink.delete({
      where: { hospital_id_pharmacy_id: { hospital_id: hospitalId, pharmacy_id: pharmacyId } }
    });
  }

  async getDispenseHistory(pharmacyId: string, scopedPharmacyId?: string | null) {
    if (scopedPharmacyId !== null && scopedPharmacyId !== undefined && pharmacyId !== scopedPharmacyId) {
      throw new AppError("Cannot view dispense history of another pharmacy", 403, "SCOPE_MISMATCH");
    }

    const records = await prisma.dispenseRecord.findMany({
      where: { pharmacy_id: pharmacyId },
      include: {
        prescription: {
          select: {
            rx_reference: true,
            patient: { select: { full_name: true } }
          }
        },
        dispensed_by_user: { select: { full_name: true } }
      },
      orderBy: { dispensed_at: "desc" }
    });

    return records.map((r) => ({
      id: r.id,
      prescription_id: r.prescription_id,
      rx_reference: r.prescription.rx_reference,
      patient_name: r.prescription.patient.full_name,
      pharmacy_id: r.pharmacy_id,
      dispensed_by: r.dispensed_by,
      dispensed_by_name: r.dispensed_by_user.full_name,
      dispensed_at: r.dispensed_at,
      notes: r.notes,
      medications_dispensed: r.medications_dispensed
    }));
  }

  async getDispenseRecordsForPharmacy(pharmacyId: string) {
    return prisma.dispenseRecord.findMany({
      where: { pharmacy_id: pharmacyId },
      include: {
        prescription: {
          select: { rx_reference: true }
        }
      },
      orderBy: { dispensed_at: "desc" }
    });
  }

  async getMedicationReminders(): Promise<void> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    const activePrescriptions = await prisma.prescription.findMany({
      where: {
        status: { in: ["active", "refill_due"] }
      },
      include: {
        medications: {
          where: { reminder_enabled: true }
        },
        patient: { select: { id: true, full_name: true } }
      }
    });

    for (const prescription of activePrescriptions) {
      for (const medication of prescription.medications) {
        if (!medication.reminder_times || medication.reminder_times.length === 0) {
          continue;
        }

        for (const timeStr of medication.reminder_times) {
          const [hours, minutes] = timeStr.split(":").map(Number);
          const timeDiff = Math.abs(
            (currentHour * 60 + currentMinute) - (hours * 60 + minutes)
          );

          if (timeDiff <= 5) {
            if (medication.last_reminder_sent) {
              const lastSent = new Date(medication.last_reminder_sent);
              if (
                lastSent.getDate() === now.getDate() &&
                lastSent.getMonth() === now.getMonth() &&
                lastSent.getFullYear() === now.getFullYear()
              ) {
                continue;
              }
            }

            await notificationService.send({
              userId: prescription.patient.id,
              type: "medication_reminder",
              title: "Medication Reminder",
              message: `\u23F0 Time to take your ${medication.drug_name} ${medication.strength} - ${medication.instructions}`,
              actionUrl: "/pharmacy",
              referenceId: prescription.id,
              sendPush: true
            });

            await prisma.prescriptionMedication.update({
              where: { id: medication.id },
              data: { last_reminder_sent: now }
            });

            logger.info(`Reminder sent for ${medication.drug_name} to patient ${prescription.patient.id}`);
          }
        }
      }
    }
  }

  private async generateRxReference(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");

    const count = await prisma.prescription.count({
      where: {
        issued_at: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      }
    });

    return `RX-${dateStr}-${String(count + 1).padStart(3, "0")}`;
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}

export const pharmacyService = new PharmacyService();

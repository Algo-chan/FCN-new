import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/app-error";
import { logger } from "../../utils/logger";
import { systemSettings } from "../../utils/system-settings";
import { notificationService } from "../notifications/notification.service";

const CHAPA_API_URL = "https://api.chapa.co/v1";
const CHAPA_SECRET_KEY = env.CHAPA_SECRET_KEY;
const CHAPA_CALLBACK_BASE = `${env.FRONTEND_URL}/api/v1/payments/chapa-webhook`;

interface ChapaInitResponse {
  status: "success" | "failed";
  message: string;
  data?: {
    checkout_url: string;
    tx_ref: string;
  };
}

interface ChapaVerifyResponse {
  status: "success" | "failed";
  message: string;
  data?: {
    tx_ref: string;
    status: string;
    amount: number;
    currency: string;
    created_at: string;
  };
}

export class ChapaService {
  async initializePayment(appointmentId: string, amount: number, payerName: string, payerEmail: string): Promise<{ checkout_url: string; tx_ref: string }> {
    const paymentEnabled = await systemSettings.isPaymentEnabled();
    const isFree = await systemSettings.isFreePeriod();

    if (!paymentEnabled || isFree) {
      return {
        checkout_url: "",
        tx_ref: `free-${appointmentId}-${Date.now()}`
      };
    }

    if (!CHAPA_SECRET_KEY) {
      throw new AppError("Chapa payment is not configured", 503, "PAYMENT_NOT_CONFIGURED");
    }

    const txRef = `fcn-${appointmentId}-${Date.now()}`;

    const payload = {
      amount: amount.toString(),
      currency: "ETB",
      email: payerEmail,
      first_name: payerName.split(" ")[0] ?? payerName,
      last_name: payerName.split(" ").slice(1).join(" ") ?? "",
      tx_ref: txRef,
      callback_url: `${CHAPA_CALLBACK_BASE}/${txRef}`,
      return_url: `${env.FRONTEND_URL}/appointments?payment_ref=${txRef}`,
      customization: {
        title: "FCN Appointment Payment",
        description: `Appointment booking fee - ETB ${amount.toFixed(2)}`
      }
    };

    const response = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = (await response.json()) as ChapaInitResponse;

    if (result.status !== "success" || !result.data) {
      logger.error("Chapa init failed", { appointmentId, chapaResponse: result });
      throw new AppError(result.message || "Payment initialization failed", 502, "PAYMENT_INIT_FAILED");
    }

    await prisma.paymentLog.create({
      data: {
        appointment_id: appointmentId,
        tx_ref: txRef,
        amount,
        status: "unpaid",
        chapa_response: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue
      }
    });

    return {
      checkout_url: result.data.checkout_url,
      tx_ref: txRef
    };
  }

  async verifyPayment(txRef: string): Promise<{ verified: boolean; amount: number }> {
    if (!CHAPA_SECRET_KEY) {
      throw new AppError("Chapa payment is not configured", 503, "PAYMENT_NOT_CONFIGURED");
    }

    const paymentEnabled = await systemSettings.isPaymentEnabled();
    const isFree = await systemSettings.isFreePeriod();

    if (!paymentEnabled || isFree) {
      return { verified: true, amount: 0 };
    }

    const response = await fetch(`${CHAPA_API_URL}/transaction/verify/${txRef}`, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`
      }
    });

    const result = (await response.json()) as ChapaVerifyResponse;

    if (result.status !== "success" || !result.data) {
      logger.error("Chapa verify failed", { txRef, chapaResponse: result });
      return { verified: false, amount: 0 };
    }

    const verified = result.data.status === "success";

    if (verified) {
      const log = await prisma.paymentLog.findFirst({
        where: { tx_ref: txRef }
      });

      if (log) {
        await prisma.paymentLog.update({
          where: { id: log.id },
          data: {
            status: "paid",
            chapa_response: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue
          }
        });
      }
    }

    return { verified, amount: result.data.amount };
  }

  verifyWebhookSignature(signature: string, body: string, secret: string): boolean {
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  async handleWebhook(txRef: string, status: string): Promise<void> {
    if (status !== "success") {
      logger.warn("Chapa webhook: payment not success", { txRef, status });
      return;
    }

    const appointment = await prisma.appointment.findFirst({
      where: { payment_tx_ref: txRef },
      include: {
        patient: true,
        doctor: true
      }
    });

    if (!appointment) {
      logger.error("Chapa webhook: appointment not found", { txRef });
      return;
    }

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        payment_status: "paid",
        status: "confirmed"
      }
    });

    await notificationService.paymentReceived(appointment.patient_id, Number(appointment.platform_fee_etb), txRef);
    await notificationService.appointmentConfirmed(
      appointment.patient_id,
      appointment.doctor_id,
      appointment.doctor.full_name,
      appointment.scheduled_at
    );
  }
}

export const chapaService = new ChapaService();

import { prisma } from "../../config/database";
import { logger } from "../../utils/logger";
import { env } from "../../config/env";

interface SendNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  referenceId?: string;
  sendPush?: boolean;
  sendSms?: boolean;
}

class NotificationService {
  async send(params: SendNotificationParams): Promise<void> {
    const { userId, type, title, message, actionUrl, referenceId, sendPush = false, sendSms = false } = params;

    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl ?? null,
        reference_id: referenceId ?? null,
        push_sent: false,
        sms_sent: false
      }
    });

    if (sendPush && env.FIREBASE_PROJECT_ID) {
      try {
        await this.sendFcmPush(userId, title, message, actionUrl);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { push_sent: true }
        });
      } catch (err) {
        logger.error("FCM push failed", { userId, error: err });
      }
    }

    if (sendSms && env.TWILIO_ACCOUNT_SID) {
      try {
        await this.sendSms(userId, message);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { sms_sent: true }
        });
      } catch (err) {
        logger.error("SMS send failed", { userId, error: err });
      }
    }
  }

  async appointmentCreated(patientId: string, doctorName: string, scheduledAt: Date): Promise<void> {
    await this.send({
      userId: patientId,
      type: "appointment_created",
      title: "Appointment Created",
      message: `Your appointment with Dr. ${doctorName} has been created for ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      actionUrl: "/appointments"
    });
  }

  async appointmentConfirmed(patientId: string, doctorId: string, doctorName: string, scheduledAt: Date): Promise<void> {
    await this.send({
      userId: patientId,
      type: "appointment_confirmed",
      title: "Appointment Confirmed",
      message: `Your appointment with Dr. ${doctorName} on ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} has been confirmed.`,
      actionUrl: "/appointments"
    });

    await this.send({
      userId: doctorId,
      type: "appointment_scheduled",
      title: "New Appointment Scheduled",
      message: `You have a new appointment scheduled on ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      actionUrl: "/appointments"
    });
  }

  async appointmentCancelled(patientId: string, doctorId: string, doctorName: string, scheduledAt: Date): Promise<void> {
    await this.send({
      userId: patientId,
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      message: `Your appointment with Dr. ${doctorName} on ${scheduledAt.toLocaleDateString()} has been cancelled.`,
      actionUrl: "/appointments"
    });

    await this.send({
      userId: doctorId,
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      message: `An appointment scheduled for ${scheduledAt.toLocaleDateString()} has been cancelled.`,
      actionUrl: "/appointments"
    });
  }

  async appointmentRescheduled(patientId: string, doctorId: string, doctorName: string, oldDate: Date, newDate: Date): Promise<void> {
    await this.send({
      userId: patientId,
      type: "appointment_rescheduled",
      title: "Appointment Rescheduled",
      message: `Your appointment with Dr. ${doctorName} has been moved from ${oldDate.toLocaleDateString()} to ${newDate.toLocaleDateString()} at ${newDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      actionUrl: "/appointments"
    });

    await this.send({
      userId: doctorId,
      type: "appointment_rescheduled",
      title: "Appointment Rescheduled",
      message: `An appointment has been rescheduled from ${oldDate.toLocaleDateString()} to ${newDate.toLocaleDateString()} at ${newDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      actionUrl: "/appointments"
    });
  }

  async paymentReceived(userId: string, amount: number, txRef: string): Promise<void> {
    await this.send({
      userId,
      type: "payment_received",
      title: "Payment Received",
      message: `Your payment of ETB ${amount.toFixed(2)} (Ref: ${txRef}) has been received successfully.`,
      actionUrl: "/appointments"
    });
  }

  async paymentFailed(userId: string, amount: number, txRef: string): Promise<void> {
    await this.send({
      userId,
      type: "payment_failed",
      title: "Payment Failed",
      message: `Your payment of ETB ${amount.toFixed(2)} (Ref: ${txRef}) has failed. Please try again.`,
      actionUrl: "/appointments"
    });
  }

  private async sendFcmPush(userId: string, title: string, message: string, actionUrl?: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcm_token: true }
    });

    if (!user?.fcm_token) {
      logger.debug("No FCM token for user", { userId });
      return;
    }

    try {
      const admin = await import("firebase-admin");
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: env.FIREBASE_PROJECT_ID,
            privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
            clientEmail: env.FIREBASE_CLIENT_EMAIL
          })
        });
      }
      const firebaseMessaging = admin.messaging();

      const pushMessage = {
        token: user.fcm_token,
        notification: { title, body: message },
        webpush: actionUrl ? { fcmOptions: { link: `${env.FRONTEND_URL}${actionUrl}` } } : undefined,
        android: { priority: "high" as const },
        apns: { payload: { aps: { sound: "default" } } }
      };

      await firebaseMessaging.send(pushMessage);
    } catch (err) {
      logger.warn("Firebase not configured or push failed", { userId, error: err });
    }
  }

  private async sendSms(userId: string, message: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true }
    });

    if (!user?.phone) {
      logger.debug("No phone for user", { userId });
      return;
    }

    try {
      const twilioModule = await import("twilio");
      const client = twilioModule.default(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      await client.messages.create({
        body: message,
        from: env.TWILIO_PHONE_NUMBER,
        to: user.phone
      });
    } catch (err) {
      logger.warn("Twilio not configured or SMS send failed", { userId, error: err });
    }
  }
}

export const notificationService = new NotificationService();

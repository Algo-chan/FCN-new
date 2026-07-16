import { prisma } from "../../config/database";
import { firebaseAdmin } from "../../config/firebase";
import { twilioClient } from "../../config/twilio";
import { env } from "../../config/env";
import { redis } from "../../config/redis";
import { systemSettings } from "../../utils/system-settings";
import { logger } from "../../utils/logger";
import { getGroupForType } from "../../constants/notifications";

const RATE_LIMIT_MAX = 50;
const RATE_LIMIT_WINDOW = 3600;

const SAFE_MESSAGE_FALLBACKS: Record<string, string> = {
  vital_alert: 'New health alert — Open FCN to view',
  ai_assessment_complete: 'Your AI assessment is ready — Open FCN to view',
  lab_results_ready: 'Lab results are ready — Open FCN to view',
  new_message: 'New message received — Open FCN to view',
  prescription_issued: 'A prescription has been issued — Open FCN to view',
  medication_reminder: 'Medication reminder — Open FCN to view',
  refill_due: 'Refill is due — Open FCN to view',
};

interface SendNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  referenceId?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  channels?: ('in_app' | 'fcm' | 'sms')[];
  imageUrl?: string;
  safeMessage?: string;
  sendPush?: boolean;
}

class NotificationService {
  async send(params: SendNotificationParams): Promise<void> {
    const {
      userId, type, title, message, actionUrl, referenceId,
      priority = 'normal', channels = ['in_app'], imageUrl, safeMessage,
      sendPush = true
    } = params;

    const rateLimited = await this.checkRateLimit(userId);
    if (rateLimited) {
      logger.warn(`Notification rate limit exceeded for user ${userId}, type ${type}`);
      return;
    }

    const groupType = getGroupForType(type);

    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl ?? null,
        reference_id: referenceId ?? null,
        group_type: groupType,
        priority,
        image_url: imageUrl ?? null,
        read: false,
        push_sent: false,
        sms_sent: false,
      }
    });

    if (channels.includes('fcm') && sendPush) {
      const pushBody = safeMessage || SAFE_MESSAGE_FALLBACKS[type] || title;
      await this.sendFcmPush(userId, notification, title, pushBody, actionUrl, priority, imageUrl);
    }

    if (channels.includes('sms')) {
      await this.sendSms(userId, message);
    }
  }

  private async checkRateLimit(userId: string): Promise<boolean> {
    try {
      const hour = Math.floor(Date.now() / 3600000);
      const key = `notif_rate:${userId}:${hour}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, RATE_LIMIT_WINDOW);
      }
      return count > RATE_LIMIT_MAX;
    } catch {
      return false;
    }
  }

  private async sendFcmPush(
    userId: string,
    notification: { id: string; type: string },
    title: string,
    message: string,
    actionUrl?: string,
    priority?: string,
    imageUrl?: string
  ): Promise<void> {
    try {
      const fcmEnabled = await systemSettings.get('fcm_enabled');
      if (fcmEnabled !== 'true') {
        logger.debug('FCM disabled via system settings');
        return;
      }
    } catch {
      logger.debug('Could not check fcm_enabled setting, proceeding with FCM');
    }

    if (!firebaseAdmin) {
      logger.debug('Firebase Admin not initialized');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcm_token: true }
    });

    if (!user?.fcm_token) {
      logger.debug('No FCM token for user', { userId });
      return;
    }

    try {
      await firebaseAdmin.messaging().send({
        token: user.fcm_token,
        notification: {
          title,
          body: message,
          imageUrl: imageUrl ?? undefined,
        },
        data: {
          type: notification.type,
          actionUrl: actionUrl || '',
          referenceId: notification.id,
          priority: priority || 'normal',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: priority === 'critical' ? 'high' : 'normal',
          notification: {
            sound: 'default',
            channelId: priority === 'critical' ? 'fcn_critical' : 'fcn_default',
            color: '#0A7EA4',
          },
        },
        webpush: {
          headers: {
            Urgency: priority === 'critical' ? 'high' : 'normal',
          },
          notification: {
            title,
            body: message,
            icon: '/logo/fcn-logo-full.png',
            badge: '/logo/fcn-badge.png',
            vibrate: [200, 100, 200],
            actions: actionUrl ? [{ action: 'open', title: 'View' }] : [],
          },
          fcmOptions: {
            link: actionUrl ? `${env.FRONTEND_URL}${actionUrl}` : 'https://app.fcncare.com',
          },
        },
      });

      await prisma.notification.updateMany({
        where: {
          user_id: userId,
          type: notification.type,
          push_sent: false,
          created_at: { gte: new Date(Date.now() - 5000) }
        },
        data: { push_sent: true }
      });
    } catch (error: any) {
      logger.error('FCM send failed:', { userId, type: notification.type, error: error.message });

      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        await prisma.user.update({
          where: { id: userId },
          data: { fcm_token: null }
        });
        logger.info(`Cleared invalid FCM token for user ${userId}`);
      }
    }
  }

  private async sendSms(userId: string, message: string): Promise<void> {
    try {
      const smsEnabled = await systemSettings.get('sms_enabled');
      if (smsEnabled !== 'true') {
        logger.info(`SMS skipped (disabled) for user ${userId}`);
        return;
      }
    } catch {
      logger.debug('Could not check sms_enabled setting');
    }

    if (!twilioClient || !env.TWILIO_PHONE_NUMBER) {
      logger.debug('Twilio not configured');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true }
    });

    if (!user?.phone) {
      logger.debug('No phone for user', { userId });
      return;
    }

    try {
      await twilioClient.messages.create({
        body: `FCN: ${message}`,
        from: env.TWILIO_PHONE_NUMBER,
        to: user.phone
      });

      await prisma.notification.updateMany({
        where: {
          user_id: userId,
          sms_sent: false,
          created_at: { gte: new Date(Date.now() - 5000) }
        },
        data: { sms_sent: true }
      });
    } catch (error: any) {
      logger.error('SMS send failed:', { userId, error: error.message });
    }
  }

  async sendToMultiple(
    userIds: string[],
    params: Omit<SendNotificationParams, 'userId'>
  ): Promise<void> {
    const BATCH_SIZE = 50;
    const allResults = await Promise.allSettled(
      userIds.slice(0, 200).map((userId) => this.send({ ...params, userId }))
    );

    const failures = allResults.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      logger.warn(`${failures.length}/${Math.min(userIds.length, 200)} notifications failed in batch send`);
    }
  }

  async sendAppointmentReminder(appointmentId: string): Promise<void> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, full_name: true } },
        doctor: { select: { full_name: true } }
      }
    });

    if (!appointment) {
      logger.warn(`Appointment ${appointmentId} not found for reminder`);
      return;
    }

    await this.send({
      userId: appointment.patient.id,
      type: 'appointment_reminder',
      title: '\u23F0 Appointment Reminder',
      message: `Your appointment with Dr. ${appointment.doctor.full_name} is in 30 minutes`,
      actionUrl: `/consultation/${appointmentId}`,
      channels: ['in_app', 'fcm'],
      priority: 'high'
    });
  }

  async appointmentCreated(patientId: string, doctorName: string, scheduledDate: Date): Promise<void> {
    await this.send({
      userId: patientId,
      type: 'appointment_created',
      title: '\u2705 Appointment Booked',
      message: `Your appointment with Dr. ${doctorName} has been booked for ${scheduledDate.toLocaleDateString()}`,
      actionUrl: '/dashboard',
      channels: ['in_app', 'fcm'],
      priority: 'normal'
    });
  }

  async appointmentCancelled(patientId: string, doctorId: string, doctorName: string, scheduledDate: Date): Promise<void> {
    await this.send({
      userId: patientId,
      type: 'appointment_cancelled',
      title: '\u274C Appointment Cancelled',
      message: `Your appointment with Dr. ${doctorName} on ${scheduledDate.toLocaleDateString()} has been cancelled`,
      actionUrl: '/dashboard',
      channels: ['in_app', 'fcm'],
      priority: 'high'
    });
  }

  async appointmentRescheduled(patientId: string, doctorId: string, doctorName: string, oldDate: Date, newDate: Date): Promise<void> {
    await this.send({
      userId: patientId,
      type: 'appointment_rescheduled',
      title: '\u{1F504} Appointment Rescheduled',
      message: `Your appointment with Dr. ${doctorName} has been moved from ${oldDate.toLocaleDateString()} to ${newDate.toLocaleDateString()}`,
      actionUrl: '/dashboard',
      channels: ['in_app', 'fcm'],
      priority: 'high'
    });
  }

  async paymentReceived(patientId: string, amount: number, txRef: string): Promise<void> {
    await this.send({
      userId: patientId,
      type: 'payment_received',
      title: '\u2705 Payment Received',
      message: `Your payment of ETB ${amount.toLocaleString()} has been received (Ref: ${txRef})`,
      actionUrl: '/payments',
      channels: ['in_app', 'fcm'],
      priority: 'normal'
    });
  }

  async appointmentConfirmed(patientId: string, doctorId: string, doctorName: string, scheduledDate: Date): Promise<void> {
    await this.send({
      userId: patientId,
      type: 'appointment_confirmed',
      title: '\u2705 Appointment Confirmed',
      message: `Your appointment with Dr. ${doctorName} on ${scheduledDate.toLocaleDateString()} is confirmed`,
      actionUrl: '/dashboard',
      channels: ['in_app', 'fcm'],
      priority: 'high'
    });
  }

  async sendWelcomeNotification(userId: string, userName: string): Promise<void> {
    await this.send({
      userId,
      type: 'welcome',
      title: '\u{1F3E5} Welcome to FCN!',
      message: `Welcome ${userName}! Healthcare Without Walls starts here. Book your first consultation today.`,
      actionUrl: '/dashboard',
      channels: ['in_app', 'fcm'],
      priority: 'normal'
    });
  }
}

export const notificationService = new NotificationService();

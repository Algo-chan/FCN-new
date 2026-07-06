import cron from "node-cron";
import { prisma } from "../config/database";
import { notificationService } from "../modules/notifications/notification.service";
import { logger } from "../utils/logger";

export function startAppointmentReminderJob(): void {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      const in30Min = new Date(now.getTime() + 30 * 60 * 1000);
      const in35Min = new Date(now.getTime() + 35 * 60 * 1000);

      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          status: "confirmed",
          reminder_sent: false,
          scheduled_at: {
            gte: in30Min,
            lte: in35Min
          }
        },
        select: { id: true }
      });

      for (const appointment of upcomingAppointments) {
        try {
          await notificationService.sendAppointmentReminder(appointment.id);

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { reminder_sent: true }
          });

          logger.info(`Appointment reminder sent for ${appointment.id}`);
        } catch (err) {
          logger.error(`Failed to send reminder for appointment ${appointment.id}`, { error: err });
        }
      }
    } catch (err) {
      logger.error("Appointment reminder job failed", { error: err });
    }
  }, {
    timezone: "Africa/Addis_Ababa"
  });

  logger.info("Appointment reminder job scheduled (every 5 min)");
}

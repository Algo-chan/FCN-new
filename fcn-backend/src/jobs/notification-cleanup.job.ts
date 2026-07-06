import cron from "node-cron";
import { prisma } from "../config/database";
import { systemSettings } from "../utils/system-settings";
import { logger } from "../utils/logger";

export function startNotificationCleanupJob(): void {
  cron.schedule("0 3 * * *", async () => {
    try {
      const retentionDaysStr = await systemSettings.get("notification_retention_days");
      const retentionDays = parseInt(retentionDaysStr, 10) || 90;

      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const deleted = await prisma.notification.deleteMany({
        where: {
          read: true,
          created_at: { lt: cutoff }
        }
      });

      if (deleted.count > 0) {
        logger.info(`Notification cleanup: deleted ${deleted.count} old read notifications`);
      }
    } catch (err) {
      logger.error("Notification cleanup job failed", { error: err });
    }
  }, {
    timezone: "Africa/Addis_Ababa"
  });

  logger.info("Notification cleanup job scheduled (daily at 03:00 EAT)");
}

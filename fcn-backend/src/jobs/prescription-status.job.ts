import cron from "node-cron";
import { prisma } from "../config/database";
import { notificationService } from "../modules/notifications/notification.service";
import { logger } from "../utils/logger";

export function startPrescriptionStatusJob(): void {
  cron.schedule("1 0 * * *", async () => {
    try {
      const now = new Date();
      logger.info("Running prescription status job");

      // Expire overdue prescriptions
      const expired = await prisma.prescription.updateMany({
        where: {
          status: { in: ["active", "refill_due"] },
          expires_at: { lt: now }
        },
        data: { status: "expired" }
      });

      if (expired.count > 0) {
        logger.info(`Expired ${expired.count} prescriptions`);
      }

      // Find prescriptions expiring in 5 days and notify
      const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      const expiringSoon = await prisma.prescription.findMany({
        where: {
          status: "active",
          expires_at: {
            gte: now,
            lte: fiveDaysFromNow
          }
        },
        include: {
          medications: {
            where: { is_ongoing: false },
            select: { drug_name: true }
          },
          patient: { select: { id: true, full_name: true } }
        }
      });

      for (const prescription of expiringSoon) {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            user_id: prescription.patient.id,
            reference_id: prescription.id,
            type: "medication_low",
            created_at: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
            }
          }
        });

        if (!existingNotification && prescription.medications.length > 0) {
          const drugNames = prescription.medications.map((m) => m.drug_name).join(", ");
          const daysRemaining = Math.ceil(
            (prescription.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          await notificationService.send({
            userId: prescription.patient.id,
            type: "medication_low",
            title: "Refill Due Soon",
            message: `\u{1F48A} ${drugNames} is running low \u2014 ${daysRemaining} days remaining`,
            actionUrl: "/pharmacy",
            referenceId: prescription.id,
            sendPush: true
          });
        }
      }

      logger.info("Prescription status job complete");
    } catch (err) {
      logger.error("Prescription status job failed", { error: err });
    }
  }, {
    timezone: "Africa/Addis_Ababa"
  });

  logger.info("Prescription status job scheduled (daily at 00:01 EAT)");
}

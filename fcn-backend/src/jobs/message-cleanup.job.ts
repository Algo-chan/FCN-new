import cron from "node-cron";
import { consultationService } from "../modules/consultation/consultation.service";
import { logger } from "../utils/logger";

export function startMessageCleanupJob(): void {
  cron.schedule(
    "0 23 * * *",
    async () => {
      logger.info("Starting message cleanup job...");
      try {
        const result = await consultationService.runMessageCleanup();
        logger.info(`Message cleanup complete: ${result.deleted} messages soft-deleted`);
      } catch (error) {
        logger.error("Message cleanup job failed:", error);
      }
    },
    {
      timezone: "Africa/Addis_Ababa"
    }
  );
  logger.info("Message cleanup cron job scheduled (daily at 2:00 AM EAT)");
}

import cron from "node-cron";
import { systemSettings } from "../utils/system-settings";
import { pharmacyService } from "../modules/pharmacy/pharmacy.service";
import { logger } from "../utils/logger";

export function startMedicationReminderJob(): void {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const enabled = await systemSettings.get("medication_reminders_enabled");
      if (enabled !== "true") return;

      await pharmacyService.getMedicationReminders();
    } catch (err) {
      logger.error("Medication reminder job failed", { error: err });
    }
  }, {
    timezone: "Africa/Addis_Ababa"
  });

  logger.info("Medication reminder job scheduled (every 5 min)");
}

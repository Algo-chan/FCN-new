import { prisma } from "../config/database";
import { logger } from "./logger";

interface LogActivityParams {
  actorId: string;
  actorRole: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: object;
  ipAddress?: string;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  const { actorId, actorRole, action, targetType, targetId, targetName, details, ipAddress } = params;

  try {
    await (prisma as any).activityLog.create({
      data: {
        actor_id: actorId,
        actor_role: actorRole,
        action,
        target_type: targetType ?? null,
        target_id: targetId ?? null,
        target_name: targetName ?? null,
        details: details ?? undefined,
        ip_address: ipAddress ?? null,
      },
    });

    logger.info(
      `[AUDIT] ${action} by ${actorRole} ${actorId} on ${targetType} ${targetId}`
    );
  } catch (error) {
    logger.error("Failed to log activity:", error);
  }
}

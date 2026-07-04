import http from "http";
import { app } from "./src/app";
import { connectDatabase, disconnectDatabase } from "./src/config/database";
import { connectRedis, disconnectRedis } from "./src/config/redis";
import { env } from "./src/config/env";
import { initSocket } from "./src/socket";
import { startMessageCleanupJob } from "./src/jobs/message-cleanup.job";
import { logger } from "./src/utils/logger";

const server = http.createServer(app);
initSocket(server);

const startServer = async (): Promise<void> => {
  await connectDatabase();
  await connectRedis();

  server.listen(env.PORT, () => {
    logger.info(`FCN backend listening on port ${env.PORT}`);
    startMessageCleanupJob();
  });
};

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down gracefully.`);

  server.close(async () => {
    await disconnectDatabase();
    await disconnectRedis();
    process.exit(0);
  });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

startServer().catch((error) => {
  logger.error("Failed to start server", { error: error instanceof Error ? error.message : String(error) });
  process.exit(1);
});

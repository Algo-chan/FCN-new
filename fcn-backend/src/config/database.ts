import { PrismaClient } from "@prisma/client";
import { env } from "./env";
import { logger } from "../utils/logger";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["warn", "error"]
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const connectDatabase = async (retries = 5, delay = 2000): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      logger.info("Database connection established");
      return;
    } catch (error) {
      logger.warn(`Database connection attempt ${attempt}/${retries} failed: ${error instanceof Error ? error.message : String(error)}`);
      if (attempt === retries) {
        throw error;
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info("Database connection closed");
};

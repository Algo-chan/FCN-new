import Redis from "ioredis";
import { env } from "../config/env";
import { prisma } from "../config/database";
import { logger } from "./logger";

const CACHE_TTL = 300;

let redis: Redis | null = null;
try {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000))
  });
  redis.on("error", (err) => logger.warn("Redis connection error (system-settings):", err));
} catch {
  logger.warn("Redis not available for system-settings, using DB fallback");
}

class SystemSettingsService {
  private cache = new Map<string, { value: string; expiry: number }>();

  async get(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.value;
    }

    if (redis?.status === "ready") {
      try {
        const cachedVal = await redis.get(`settings:${key}`);
        if (cachedVal !== null) {
          this.cache.set(key, { value: cachedVal, expiry: Date.now() + CACHE_TTL * 1000 });
          return cachedVal;
        }
      } catch {
        /* fall through */
      }
    }

    const setting = await prisma.systemSettings.findUnique({ where: { key } });
    if (!setting) return null;

    const value = setting.value;
    this.cache.set(key, { value, expiry: Date.now() + CACHE_TTL * 1000 });

    if (redis?.status === "ready") {
      redis.set(`settings:${key}`, value, "EX", CACHE_TTL).catch(() => {});
    }

    return value;
  }

  async set(key: string, value: string, description?: string): Promise<void> {
    await prisma.systemSettings.upsert({
      where: { key },
      create: { key, value, description: description ?? null },
      update: { value, description: description ?? undefined }
    });

    this.cache.delete(key);
    if (redis?.status === "ready") {
      redis.del(`settings:${key}`).catch(() => {});
    }
  }

  async getAll(): Promise<Array<{ key: string; value: string; description: string | null }>> {
    const settings = await prisma.systemSettings.findMany({ orderBy: { key: "asc" } });
    return settings.map((s) => ({ key: s.key, value: s.value, description: s.description }));
  }

  async isPaymentEnabled(): Promise<boolean> {
    const val = await this.get("payment_enabled");
    return val === "true";
  }

  async isFreePeriod(): Promise<boolean> {
    const freePeriodEnds = await this.get("free_period_ends_at");
    if (!freePeriodEnds) return false;
    return new Date() < new Date(freePeriodEnds);
  }

  invalidateCache(key: string): void {
    this.cache.delete(key);
  }
}

export const systemSettings = new SystemSettingsService();

import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined
});

redis.on("connect", () => logger.info("Redis connection established"));
redis.on("error", (error) => logger.error("Redis connection error", { error: error.message }));

export const redisGet = async (key: string): Promise<string | null> => redis.get(key);

export const redisSet = async (key: string, value: string, ttlSeconds?: number): Promise<"OK" | null> => {
  if (ttlSeconds) {
    return redis.set(key, value, "EX", ttlSeconds);
  }
  return redis.set(key, value);
};

export const redisDel = async (key: string): Promise<number> => redis.del(key);

export const redisExists = async (key: string): Promise<boolean> => (await redis.exists(key)) === 1;

export const connectRedis = async (): Promise<void> => {
  await redis.ping();
};

export const disconnectRedis = async (): Promise<void> => {
  redis.disconnect();
  logger.info("Redis connection closed");
};

export const get = redisGet;
export const set = redisSet;
export const del = redisDel;
export const exists = redisExists;

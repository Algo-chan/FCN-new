import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

interface MemoryRecord {
  value: string;
  expiresAt: number | null;
}

const memoryStore = new Map<string, MemoryRecord>();

const getMemory = (key: string): string | null => {
  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expiresAt !== null && Date.now() > item.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return item.value;
};

const setMemory = (key: string, value: string, ttlSeconds?: number): "OK" => {
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  memoryStore.set(key, { value, expiresAt });
  return "OK";
};

const delMemory = (key: string): number => {
  return memoryStore.delete(key) ? 1 : 0;
};

let useInMemoryFallback = false;

const isPlaceholderUrl = (url: string) =>
  !url ||
  url.includes("your_upstash") ||
  url.includes("localhost:6379") ||
  url.includes("placeholder");

let redisClient: Redis | null = null;

if (!isPlaceholderUrl(env.REDIS_URL)) {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableReadyCheck: false,
      lazyConnect: true,
      tls: env.REDIS_URL.startsWith("rediss://") ? {} : undefined
    });

    redisClient.on("connect", () => logger.info("Redis connection established"));
    redisClient.on("error", (error) => {
      logger.warn("Redis connection error, falling back to in-memory store", { error: error.message });
      useInMemoryFallback = true;
    });
  } catch {
    useInMemoryFallback = true;
  }
} else {
  useInMemoryFallback = true;
  logger.info("Using in-memory Redis fallback (REDIS_URL is unconfigured/placeholder)");
}

// Proxied redis object supporting eval for rate-limit
export const redis = new Proxy(redisClient ?? ({} as any), {
  get(target, prop, receiver) {
    if (prop === "eval") {
      return async (_script: string, _numKeys: number, key: string, windowSecondsStr: string) => {
        if (!useInMemoryFallback && redisClient && redisClient.status === "ready") {
          try {
            return await (redisClient as any).eval(_script, _numKeys, key, windowSecondsStr);
          } catch {
            useInMemoryFallback = true;
          }
        }
        // In-memory rate limiting: INCR and EXPIRE
        const current = getMemory(key);
        const count = current ? parseInt(current, 10) + 1 : 1;
        const windowSeconds = parseInt(windowSecondsStr, 10) || 60;
        setMemory(key, count.toString(), windowSeconds);
        return count;
      };
    }

    if (prop === "get") {
      return async (key: string) => {
        if (!useInMemoryFallback && redisClient && redisClient.status === "ready") {
          try {
            return await redisClient.get(key);
          } catch {
            useInMemoryFallback = true;
          }
        }
        return getMemory(key);
      };
    }

    if (prop === "set") {
      return async (key: string, value: string, ...args: any[]) => {
        if (!useInMemoryFallback && redisClient && redisClient.status === "ready") {
          try {
            return await (redisClient.set as any)(key, value, ...args);
          } catch {
            useInMemoryFallback = true;
          }
        }
        const ttl = args[0] === "EX" ? args[1] : undefined;
        return setMemory(key, value, ttl);
      };
    }

    if (useInMemoryFallback || !redisClient) {
      if (prop === "status") return "ready";
      return () => Promise.resolve();
    }

    return Reflect.get(target, prop, receiver);
  }
});

export const redisGet = async (key: string): Promise<string | null> => {
  if (!useInMemoryFallback && redisClient && redisClient.status === "ready") {
    try {
      return await redisClient.get(key);
    } catch {
      useInMemoryFallback = true;
    }
  }
  return getMemory(key);
};

export const redisSet = async (key: string, value: string, ttlSeconds?: number): Promise<"OK" | null> => {
  if (!useInMemoryFallback && redisClient && redisClient.status === "ready") {
    try {
      if (ttlSeconds) {
        return await redisClient.set(key, value, "EX", ttlSeconds);
      }
      return await redisClient.set(key, value);
    } catch {
      useInMemoryFallback = true;
    }
  }
  return setMemory(key, value, ttlSeconds);
};

export const redisDel = async (key: string): Promise<number> => {
  if (!useInMemoryFallback && redisClient && redisClient.status === "ready") {
    try {
      return await redisClient.del(key);
    } catch {
      useInMemoryFallback = true;
    }
  }
  return delMemory(key);
};

export const redisExists = async (key: string): Promise<boolean> => {
  if (!useInMemoryFallback && redisClient && redisClient.status === "ready") {
    try {
      return (await redisClient.exists(key)) === 1;
    } catch {
      useInMemoryFallback = true;
    }
  }
  return getMemory(key) !== null;
};

export const connectRedis = async (): Promise<void> => {
  if (useInMemoryFallback || !redisClient) {
    useInMemoryFallback = true;
    logger.info("Redis running in local in-memory mode");
    return;
  }

  try {
    await redisClient.connect();
    await redisClient.ping();
  } catch (error) {
    logger.warn("Could not connect to Redis, falling back to in-memory store", {
      error: error instanceof Error ? error.message : String(error)
    });
    useInMemoryFallback = true;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient && !useInMemoryFallback) {
    try {
      redisClient.disconnect();
    } catch { }
  }
  logger.info("Redis connection closed");
};

export const get = redisGet;
export const set = redisSet;
export const del = redisDel;
export const exists = redisExists;

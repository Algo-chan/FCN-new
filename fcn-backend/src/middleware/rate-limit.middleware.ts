import type { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/response";
import { redis } from "../config/redis";

interface RateLimitOptions {
  keyPrefix?: string;
  maxRequests?: number;
  windowSeconds?: number;
}

export const redisRateLimit = (options: RateLimitOptions = {}) => {
  const keyPrefix = options.keyPrefix ?? "rate-limit";
  const maxRequests = options.maxRequests ?? 100;
  const windowSeconds = options.windowSeconds ?? 60;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.ip || "unknown";
    const key = `${keyPrefix}:${identifier}`;

    try {
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(maxRequests - count, 0));

      if (count > maxRequests) {
        errorResponse(res, "Too many requests. Please try again later.", 429, "RATE_LIMITED");
        return;
      }

      next();
    } catch {
      next();
    }
  };
};

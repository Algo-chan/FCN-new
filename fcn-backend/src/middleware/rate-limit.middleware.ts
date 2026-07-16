import type { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/response";
import { redis } from "../config/redis";

interface RateLimitOptions {
  keyPrefix?: string;
  maxRequests?: number;
  windowSeconds?: number;
}

const INCR_EXPIRE_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return count
`;

export const redisRateLimit = (options: RateLimitOptions = {}) => {
  const keyPrefix = options.keyPrefix ?? "rate-limit";
  const maxRequests = options.maxRequests ?? 100;
  const windowSeconds = options.windowSeconds ?? 60;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier = req.ip || "unknown";
    const key = `${keyPrefix}:${identifier}`;

    try {
      const result = await redis.eval(INCR_EXPIRE_SCRIPT, 1, key, windowSeconds.toString());
      const count = Number(result);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(maxRequests - count, 0));

      if (count > maxRequests) {
        errorResponse(res, "Too many requests. Please try again later.", 429, "RATE_LIMITED");
        return;
      }

      next();
    } catch {
      errorResponse(res, "Service temporarily unavailable", 503, "RATE_LIMIT_UNAVAILABLE");
    }
  };
};

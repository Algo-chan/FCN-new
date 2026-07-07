import type { Request, Response, NextFunction } from "express";
import { waitlistService } from "./waitlist.service";
import { successResponse, errorResponse } from "../../utils/response";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRequestCounts.entries()) {
    if (now > entry.resetAt) ipRequestCounts.delete(ip);
  }
}, 60000);

export async function addToWaitlistController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkIpRateLimit(ip)) {
      errorResponse(res, "Too many requests. Please try again later.", 429, "RATE_LIMITED");
      return;
    }

    const { name, email } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      errorResponse(res, "Name must be at least 2 characters", 400, "VALIDATION_ERROR");
      return;
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      errorResponse(res, "Valid email is required", 400, "VALIDATION_ERROR");
      return;
    }

    await waitlistService.addToWaitlist(name.trim(), email.trim().toLowerCase());
    successResponse(res, { message: "You're on the list!" });
  } catch (err) {
    next(err);
  }
}

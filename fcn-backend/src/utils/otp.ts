import crypto from "crypto";
import { redisDel, redisGet, redisSet } from "../config/redis";

const OTP_TTL_SECONDS = 10 * 60;

const otpKey = (phone: string): string => `otp:${phone}`;

export const generateOTP = (): string => crypto.randomInt(100000, 1000000).toString();

const hashOTP = (otp: string): string => crypto.createHash("sha256").update(otp).digest("hex");

export const storeOTP = async (phone: string, otp: string): Promise<void> => {
  await redisSet(otpKey(phone), hashOTP(otp), OTP_TTL_SECONDS);
};

export const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
  const key = otpKey(phone);
  const storedHash = await redisGet(key);

  if (!storedHash) {
    return false;
  }

  const expected = Buffer.from(storedHash, "hex");
  const actual = Buffer.from(hashOTP(otp), "hex");

  let match: boolean;
  try {
    match = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    match = false;
  }

  if (!match) {
    return false;
  }

  await redisDel(key);
  return true;
};


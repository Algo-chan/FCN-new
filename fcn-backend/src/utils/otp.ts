import crypto from "crypto";
import { redisDel, redisGet, redisSet } from "../config/redis";

const OTP_TTL_SECONDS = 10 * 60;

const otpKey = (phone: string): string => `otp:${phone}`;

export const generateOTP = (): string => crypto.randomInt(100000, 1000000).toString();

export const storeOTP = async (phone: string, otp: string): Promise<void> => {
  await redisSet(otpKey(phone), otp, OTP_TTL_SECONDS);
};

export const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
  const key = otpKey(phone);
  const storedOtp = await redisGet(key);

  if (!storedOtp || storedOtp !== otp) {
    return false;
  }

  await redisDel(key);
  return true;
};

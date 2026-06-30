import crypto from "crypto";
import { env } from "../config/env";

const ALGORITHM = "aes-256-cbc";
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");

export const encrypt = (text: string): { encrypted: string; iv: string } => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);

  return {
    encrypted: encrypted.toString("hex"),
    iv: iv.toString("hex")
  };
};

export const decrypt = (encrypted: string, iv: string): string => {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, "hex")),
    decipher.final()
  ]);

  return decrypted.toString("utf8");
};

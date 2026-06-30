import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role, UserStatus } from "@prisma/client";
import { env } from "../config/env";
import type { JwtAccessPayload, JwtRefreshPayload } from "../types";

const sign = (payload: object, secret: string, expiresIn: SignOptions["expiresIn"]): string => {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
};

export const generateAccessToken = (userId: string, role: Role, status: UserStatus = "active"): string =>
  sign(
    { id: userId, role, status, type: "access" },
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  );

export const generateRefreshToken = (userId: string): string =>
  sign(
    { id: userId, type: "refresh" },
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
  );

export const verifyAccessToken = (token: string): JwtAccessPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtAccessPayload;
  if (decoded.type !== "access") {
    throw new Error("Invalid access token type");
  }
  return decoded;
};

export const verifyRefreshToken = (token: string): JwtRefreshPayload => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
  if (decoded.type !== "refresh") {
    throw new Error("Invalid refresh token type");
  }
  return decoded;
};

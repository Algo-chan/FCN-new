import winston from "winston";
import { env } from "../config/env";

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: env.NODE_ENV === "development" ? "debug" : "info"
  })
];

export const logger = winston.createLogger({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  levels: winston.config.npm.levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      const metadata = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
      return `${timestamp} [${level}] ${stack ?? message}${metadata}`;
    })
  ),
  transports
});

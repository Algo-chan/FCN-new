import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorMiddleware = (
  error: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  let statusCode = error.statusCode ?? 500;
  let code = error.code ?? "INTERNAL_SERVER_ERROR";
  let message = error.message || "An unexpected error occurred";

  if (error instanceof ZodError) {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    message = error.issues.map((issue) => issue.message).join("; ");
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      statusCode = 409;
      code = "CONFLICT";
      message = "A record with this value already exists";
    } else if (error.code === "P2025") {
      statusCode = 404;
      code = "NOT_FOUND";
      message = "The requested record was not found";
    }
  }

  logger.error(message, {
    code,
    statusCode
  });

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: statusCode === 500 ? "Internal server error" : message
    }
  });
};

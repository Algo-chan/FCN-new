import type { Response } from "express";
import type { ApiMeta } from "../types";

export const successResponse = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiMeta
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta ? { meta } : {})
  });
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 400,
  code = "BAD_REQUEST"
): Response => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
};

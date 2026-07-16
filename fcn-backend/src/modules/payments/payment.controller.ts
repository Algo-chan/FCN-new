import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { env } from "../../config/env";
import { chapaService } from "./chapa.service";
import { logger } from "../../utils/logger";

export const chapaWebhookController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers["x-chapa-signature"] as string;
    if (!signature) {
      throw new AppError("Missing webhook signature", 401, "MISSING_SIGNATURE");
    }

    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const secret = env.CHAPA_WEBHOOK_SECRET || env.CHAPA_SECRET_KEY;
    const isValid = chapaService.verifyWebhookSignature(signature, rawBody, secret);

    if (!isValid) {
      logger.warn("Invalid Chapa webhook signature");
      throw new AppError("Invalid webhook signature", 401, "INVALID_SIGNATURE");
    }

    const { tx_ref, status } = req.body;

    if (!tx_ref || !status) {
      throw new AppError("Missing tx_ref or status in webhook payload", 400, "INVALID_PAYLOAD");
    }

    await chapaService.handleWebhook(tx_ref, status);

    successResponse(res, { message: "Webhook processed" });
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tx_ref } = req.params;
    if (!tx_ref || typeof tx_ref !== "string") {
      throw new AppError("Transaction reference is required", 400, "TX_REF_REQUIRED");
    }

    const result = await chapaService.verifyPayment(tx_ref);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

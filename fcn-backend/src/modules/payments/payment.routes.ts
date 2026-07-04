import { Router } from "express";
import { chapaWebhookController, verifyPaymentController } from "./payment.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

export const paymentRoutes = Router();

paymentRoutes.post("/chapa-webhook", chapaWebhookController);
paymentRoutes.get("/verify/:tx_ref", authMiddleware, verifyPaymentController);

import { Router } from "express";
import { addToWaitlistController } from "./waitlist.controller";

export const waitlistRoutes = Router();

waitlistRoutes.post("/", addToWaitlistController);

import { Router } from "express";
import { instantConsultController } from "./instant-consult.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";

const router = Router();

router.use(authMiddleware);

// Patient routes
router.post(
  "/request",
  requireRole("patient"),
  instantConsultController.requestInstantConsult.bind(instantConsultController)
);

router.post(
  "/cancel",
  requireRole("patient"),
  instantConsultController.cancelInstantConsult.bind(instantConsultController)
);

router.get(
  "/queue-status",
  requireRole("patient"),
  instantConsultController.getQueueStatus.bind(instantConsultController)
);

// Doctor routes
router.post(
  "/accept",
  requireRole("doctor"),
  instantConsultController.acceptInstantConsult.bind(instantConsultController)
);

router.post(
  "/decline",
  requireRole("doctor"),
  instantConsultController.declineInstantConsult.bind(instantConsultController)
);

export const instantConsultRoutes = router;

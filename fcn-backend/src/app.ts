import cors from "cors";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { corsOrigins, env } from "./config/env";
import { configurePassport } from "./config/passport";
import { errorMiddleware } from "./middleware/error.middleware";
import { redisRateLimit } from "./middleware/rate-limit.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { onboardingRoutes } from "./modules/auth/onboarding.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { hospitalRoutes } from "./modules/hospitals/hospitals.routes";
import { successResponse } from "./utils/response";
import { logger } from "./utils/logger";

export const app = express();
configurePassport();

app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax"
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);
app.use(redisRateLimit());

app.get("/health", (_req, res) => {
  successResponse(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/onboarding", onboardingRoutes);

app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/hospitals", hospitalRoutes);

app.use(errorMiddleware);

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
import { doctorRoutes } from "./modules/doctors/doctors.routes";
import { appointmentRoutes } from "./modules/appointments/appointments.routes";
import { paymentRoutes } from "./modules/payments/payment.routes";
import { settingsRoutes } from "./modules/settings/settings.routes";
import { consultationRoutes } from "./modules/consultation/consultation.routes";
import { healthRecordsRoutes } from "./modules/health-records/health-records.routes";
import { aiTriageRoutes } from "./modules/ai-triage/ai-triage.routes";
import { pharmacyRoutes } from "./modules/pharmacy/pharmacy.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { adminRoutes } from "./modules/admin/admin.routes";
import { doctorDashboardRoutes } from "./modules/doctor-dashboard/doctor-dashboard.routes";
import { nurseDashboardRoutes } from "./modules/nurse-dashboard/nurse-dashboard.routes";
import { profileRoutes } from "./modules/profile/profile.routes";
import { waitlistRoutes } from "./modules/waitlist/waitlist.routes";
import { successResponse } from "./utils/response";
import { logger } from "./utils/logger";

export const app = express();
configurePassport();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: corsOrigins,
    credentials: true
  })
);
app.use(express.json({ limit: "10mb", verify: (req, _res, buf) => { (req as any).rawBody = buf.toString(); } }));
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
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/consultations", consultationRoutes);
app.use("/api/v1/health-records", healthRecordsRoutes);
app.use("/api/v1/ai-triage", aiTriageRoutes);
app.use("/api/v1/pharmacy", pharmacyRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/doctor-dashboard", doctorDashboardRoutes);
app.use("/api/v1/nurse-dashboard", nurseDashboardRoutes);
app.use("/api/v1/profile", profileRoutes);

app.use("/api/v1/waitlist", waitlistRoutes);

app.use(errorMiddleware);

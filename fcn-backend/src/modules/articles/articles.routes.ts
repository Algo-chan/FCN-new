import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.guard";
import {
  createArticleController,
  deleteArticleController,
  getAdminArticlesController,
  getArticleBySlugController,
  getArticlesController,
  getDoctorArticlesController,
  moderateArticleController,
  updateArticleController
} from "./articles.controller";

export const articleRoutes = Router();
export const adminArticleRoutes = Router();

const doctorOnly = [authMiddleware, requireRole("doctor")];
const adminOnly = [authMiddleware, requireRole("super_admin")];

// --- Public Endpoints & Doctor Scoped Endpoints ---
// Specific route /my MUST be registered before /:slug
articleRoutes.get("/my", ...doctorOnly, getDoctorArticlesController);
articleRoutes.post("/", ...doctorOnly, createArticleController);
articleRoutes.put("/:id", ...doctorOnly, updateArticleController);
articleRoutes.delete("/:id", ...doctorOnly, deleteArticleController);

// Public article directory & reader
articleRoutes.get("/", getArticlesController);
articleRoutes.get("/:slug", getArticleBySlugController);

// --- Admin Moderation Endpoints ---
adminArticleRoutes.get("/", ...adminOnly, getAdminArticlesController);
adminArticleRoutes.patch("/:id/status", ...adminOnly, moderateArticleController);

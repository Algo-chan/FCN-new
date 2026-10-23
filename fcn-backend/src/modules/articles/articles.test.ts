import { beforeEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { errorMiddleware } from "../../middleware/error.middleware";

const { serviceMock, authUserMock } = vi.hoisted(() => ({
  serviceMock: {
    getPublishedArticles: vi.fn(),
    getArticleBySlug: vi.fn(),
    getDoctorArticles: vi.fn(),
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
    deleteArticle: vi.fn(),
    getAdminArticles: vi.fn(),
    moderateArticle: vi.fn()
  },
  authUserMock: {
    current: null as any
  }
}));

vi.mock("./articles.service", () => serviceMock);

vi.mock("../../middleware/auth.middleware", () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    if (!authUserMock.current) {
      res.status(401).json({ success: false, error: { message: "Unauthorized" } });
      return;
    }
    req.user = authUserMock.current;
    next();
  }
}));

import { articleRoutes, adminArticleRoutes } from "./articles.routes";

const app = express();
app.use(express.json());
app.use("/api/v1/articles", articleRoutes);
app.use("/api/v1/admin/articles", adminArticleRoutes);
app.use(errorMiddleware);

describe("Articles Module API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUserMock.current = null;
  });

  describe("Public Routes", () => {
    it("GET /api/v1/articles returns paginated published articles", async () => {
      const mockResult = {
        articles: [
          {
            id: "art-1",
            slug: "managing-diabetes",
            title: "Managing Diabetes",
            excerpt: "A guide for Ethiopian patients",
            category: "General Medicine",
            reading_time_minutes: 5,
            views_count: 120,
            published_at: "2026-10-20T10:00:00.000Z",
            author: {
              user_id: "doc-1",
              specialty: "General Medicine",
              user: { full_name: "Dr. Abebe Bekele" }
            }
          }
        ],
        pagination: { page: 1, limit: 12, total: 1, totalPages: 1 }
      };

      serviceMock.getPublishedArticles.mockResolvedValueOnce(mockResult);

      const res = await request(app).get("/api/v1/articles?category=General%20Medicine");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.articles).toHaveLength(1);
      expect(serviceMock.getPublishedArticles).toHaveBeenCalledWith(
        expect.objectContaining({ category: "General Medicine" })
      );
    });

    it("GET /api/v1/articles/:slug returns article details", async () => {
      const mockArticle = {
        id: "art-1",
        slug: "managing-diabetes",
        title: "Managing Diabetes",
        content: "Detailed markdown content about diabetes in Ethiopia.",
        excerpt: "A guide for Ethiopian patients",
        status: "published",
        author: {
          user_id: "doc-1",
          specialty: "General Medicine",
          user: { full_name: "Dr. Abebe Bekele" }
        }
      };

      serviceMock.getArticleBySlug.mockResolvedValueOnce(mockArticle);

      const res = await request(app).get("/api/v1/articles/managing-diabetes");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe("managing-diabetes");
    });
  });

  describe("Doctor Scoped Routes", () => {
    it("rejects unauthorized requests to /my", async () => {
      const res = await request(app).get("/api/v1/articles/my");
      expect(res.status).toBe(401);
    });

    it("rejects non-doctor users from /my", async () => {
      authUserMock.current = { id: "pat-1", role: "patient", status: "active" };

      const res = await request(app).get("/api/v1/articles/my");
      expect(res.status).toBe(403);
    });

    it("allows doctor to get their own articles", async () => {
      authUserMock.current = { id: "doc-1", role: "doctor", status: "active" };

      serviceMock.getDoctorArticles.mockResolvedValueOnce({
        articles: [],
        stats: { total: 0, published: 0, pending_review: 0, draft: 0, rejected: 0, total_views: 0 },
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });

      const res = await request(app).get("/api/v1/articles/my");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(serviceMock.getDoctorArticles).toHaveBeenCalledWith("doc-1", expect.any(Object));
    });

    it("validates input when doctor creates an article", async () => {
      authUserMock.current = { id: "doc-1", role: "doctor", status: "active" };

      // Invalid input (missing excerpt, content too short)
      const res = await request(app)
        .post("/api/v1/articles")
        .send({ title: "Hi" });

      expect(res.status).toBe(422);
      expect(serviceMock.createArticle).not.toHaveBeenCalled();
    });

    it("allows doctor to create an article with valid payload", async () => {
      authUserMock.current = { id: "doc-1", role: "doctor", status: "active" };

      const newArticle = {
        title: "Understanding Childhood Asthma Symptoms",
        excerpt: "Early signs and triggers of pediatric asthma in highland Ethiopia.",
        content: "Asthma is one of the most common chronic diseases among children. This comprehensive clinical guide covers diagnosis, inhaler usage, and environmental triggers.",
        category: "Pediatrics",
        status: "pending_review"
      };

      serviceMock.createArticle.mockResolvedValueOnce({
        id: "art-2",
        slug: "understanding-childhood-asthma-symptoms",
        ...newArticle
      });

      const res = await request(app)
        .post("/api/v1/articles")
        .send(newArticle);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(serviceMock.createArticle).toHaveBeenCalledWith(
        "doc-1",
        expect.objectContaining({ title: newArticle.title })
      );
    });
  });

  describe("Admin Moderation Routes", () => {
    it("rejects non-admin users from moderation queue", async () => {
      authUserMock.current = { id: "doc-1", role: "doctor", status: "active" };

      const res = await request(app).get("/api/v1/admin/articles");
      expect(res.status).toBe(403);
    });

    it("allows super admin to moderate article", async () => {
      authUserMock.current = { id: "admin-1", role: "super_admin", status: "active" };

      serviceMock.moderateArticle.mockResolvedValueOnce({
        id: "art-2",
        status: "published",
        published_at: new Date().toISOString()
      });

      const res = await request(app)
        .patch("/api/v1/admin/articles/art-2/status")
        .send({ status: "published" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(serviceMock.moderateArticle).toHaveBeenCalledWith(
        "admin-1",
        "art-2",
        { status: "published" }
      );
    });

    it("requires rejection reason when rejecting article", async () => {
      authUserMock.current = { id: "admin-1", role: "super_admin", status: "active" };

      const res = await request(app)
        .patch("/api/v1/admin/articles/art-2/status")
        .send({ status: "rejected" });

      expect(res.status).toBe(422);
      expect(serviceMock.moderateArticle).not.toHaveBeenCalled();
    });
  });
});

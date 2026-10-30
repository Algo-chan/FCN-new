import { AppError } from "../../utils/app-error";
import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../../utils/jwt";
import { successResponse } from "../../utils/response";
import * as articlesService from "./articles.service";
import {
  articleQuerySchema,
  createArticleSchema,
  moderateArticleSchema,
  updateArticleSchema
} from "./articles.validators";

export async function getArticlesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = articleQuerySchema.parse(req.query);
    const result = await articlesService.getPublishedArticles(query);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getArticleBySlugController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let viewer: { id: string; role: string } | undefined = req.user
      ? { id: req.user.id, role: req.user.role }
      : undefined;

    if (!viewer && req.header("Authorization")?.startsWith("Bearer ")) {
      try {
        const token = req.header("Authorization")!.slice(7);
        const decoded = verifyAccessToken(token);
        viewer = { id: decoded.id, role: decoded.role };
      } catch {
        // Continue as anonymous reader
      }
    }

    const article = await articlesService.getArticleBySlug(req.params.slug, viewer);
    successResponse(res, article);
  } catch (error) {
    next(error);
  }
}

export async function getDoctorArticlesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = articleQuerySchema.parse(req.query);
    const result = await articlesService.getDoctorArticles(req.user!.id, query);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function createArticleController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = createArticleSchema.parse(req.body);
    const article = await articlesService.createArticle(req.user!.id, input);
    successResponse(res, article, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateArticleController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = updateArticleSchema.parse(req.body);
    const article = await articlesService.updateArticle(
      req.user!.id,
      req.params.id,
      input
    );
    successResponse(res, article);
  } catch (error) {
    next(error);
  }
}

export async function deleteArticleController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await articlesService.deleteArticle(
      req.user!.id,
      req.params.id
    );
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getAdminArticlesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = articleQuerySchema.parse(req.query);
    const result = await articlesService.getAdminArticles(query);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

export async function moderateArticleController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = moderateArticleSchema.parse(req.body);
    const article = await articlesService.moderateArticle(
      req.user!.id,
      req.params.id,
      input
    );
    successResponse(res, article);
  } catch (error) {
    next(error);
  }
}

export async function uploadArticleImageController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError("No image file uploaded", 400, "FILE_REQUIRED");
    }

    const result = await articlesService.uploadArticleImage(
      req.user!.id,
      req.file.buffer
    );
    successResponse(res, result, 200);
  } catch (error) {
    next(error);
  }
}

import { z } from "zod";

export const createArticleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters"),
  excerpt: z
    .string()
    .trim()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt cannot exceed 500 characters"),
  content: z
    .string()
    .trim()
    .min(50, "Content must be at least 50 characters"),
  category: z.string().trim().min(2, "Category is required"),
  cover_image_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  status: z.enum(["draft", "pending_review"]).optional().default("draft")
});

export const updateArticleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  excerpt: z
    .string()
    .trim()
    .min(10, "Excerpt must be at least 10 characters")
    .max(500, "Excerpt cannot exceed 500 characters")
    .optional(),
  content: z
    .string()
    .trim()
    .min(50, "Content must be at least 50 characters")
    .optional(),
  category: z.string().trim().min(2, "Category is required").optional(),
  cover_image_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  status: z.enum(["draft", "pending_review"]).optional()
});

export const articleQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(12),
  category: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(["draft", "pending_review", "published", "rejected"]).optional()
});

export const moderateArticleSchema = z
  .object({
    status: z.enum(["published", "rejected"]),
    rejection_reason: z
      .string()
      .trim()
      .min(3, "Rejection reason must be at least 3 characters")
      .optional()
  })
  .refine(
    (data) => {
      if (data.status === "rejected" && (!data.rejection_reason || data.rejection_reason.length < 3)) {
        return false;
      }
      return true;
    },
    {
      message: "A rejection reason is required when rejecting an article",
      path: ["rejection_reason"]
    }
  );

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleQueryParams = z.infer<typeof articleQuerySchema>;
export type ModerateArticleInput = z.infer<typeof moderateArticleSchema>;

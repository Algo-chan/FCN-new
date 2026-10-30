import { prisma } from "../../config/database";
import { AppError } from "../../utils/app-error";
import { logger } from "../../utils/logger";
import type {
  ArticleQueryParams,
  CreateArticleInput,
  ModerateArticleInput,
  UpdateArticleInput
} from "./articles.validators";

function slugify(text: string): string {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u1200-\u137F-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return base.slice(0, 80) || "article";
}

async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = "article";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.article.findUnique({
      where: { slug }
    });
    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

function calculateReadingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const authorPublicSelect = {
  select: {
    user_id: true,
    specialty: true,
    photo_url: true,
    verified: true,
    years_experience: true,
    consultation_fee_etb: true,
    rating_average: true,
    rating_count: true,
    bio: true,
    city: true,
    hospital: {
      select: {
        id: true,
        name: true,
        location: true
      }
    },
    user: {
      select: {
        id: true,
        full_name: true,
        phone: true
      }
    }
  }
};

export async function getPublishedArticles(query: ArticleQueryParams) {
  const { page = 1, limit = 12, category, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    status: "published"
  };

  if (category && category !== "All") {
    where.category = { equals: category, mode: "insensitive" };
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { excerpt: { contains: term, mode: "insensitive" } }
    ];
  }

  const total = await prisma.article.count({ where });
  const articles = await prisma.article.findMany({
    where,
    skip,
    take: limit,
    orderBy: { published_at: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      cover_image_url: true,
      category: true,
      reading_time_minutes: true,
      views_count: true,
      published_at: true,
      created_at: true,
      author: authorPublicSelect
    }
  });

  return {
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function getArticleBySlug(
  slug: string,
  viewer?: { id: string; role: string }
) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      author: authorPublicSelect
    }
  });

  if (!article) {
    throw new AppError("Article not found", 404, "NOT_FOUND");
  }

  // Moderation security check: non-published articles only accessible by author or admin
  if (article.status !== "published") {
    const isAuthor = viewer && viewer.id === article.author_id;
    const isAdmin =
      viewer && (viewer.role === "super_admin" || viewer.role === "hospital_admin");
    if (!isAuthor && !isAdmin) {
      throw new AppError("Article not found or not published", 404, "NOT_FOUND");
    }
  } else {
    // Increment view count asynchronously if viewer is a public reader / patient
    const isAuthor = viewer && viewer.id === article.author_id;
    if (!isAuthor) {
      prisma.article
        .update({
          where: { id: article.id },
          data: { views_count: { increment: 1 } }
        })
        .catch((err) =>
          logger.warn("Failed to increment article views_count", { error: err })
        );
    }
  }

  return article;
}

export async function getDoctorArticles(
  doctorId: string,
  query: ArticleQueryParams
) {
  const { page = 1, limit = 10, status, category, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    author_id: doctorId
  };

  if (status) {
    where.status = status;
  }

  if (category && category !== "All") {
    where.category = { equals: category, mode: "insensitive" };
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { excerpt: { contains: term, mode: "insensitive" } }
    ];
  }

  const total = await prisma.article.count({ where });
  const articles = await prisma.article.findMany({
    where,
    skip,
    take: limit,
    orderBy: { updated_at: "desc" }
  });
  const statsGroup = await prisma.article.groupBy({
    by: ["status"],
    where: { author_id: doctorId },
    _count: { _all: true },
    _sum: { views_count: true }
  });

  const stats: Record<string, number> = {
    total: 0,
    published: 0,
    pending_review: 0,
    draft: 0,
    rejected: 0,
    total_views: 0
  };

  for (const group of statsGroup) {
    stats[group.status] = group._count._all;
    stats.total += group._count._all;
    stats.total_views += group._sum.views_count || 0;
  }

  return {
    articles,
    stats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function createArticle(doctorId: string, input: CreateArticleInput) {
  const profile = await prisma.doctorProfile.findUnique({
    where: { user_id: doctorId }
  });

  if (!profile) {
    throw new AppError("Doctor profile not found", 404, "DOCTOR_NOT_FOUND");
  }

  const slug = await generateUniqueSlug(input.title);
  const readingTime = calculateReadingTimeMinutes(input.content);
  const status = input.status === "pending_review" ? "pending_review" : "draft";

  const article = await prisma.article.create({
    data: {
      slug,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      category: input.category,
      cover_image_url: input.cover_image_url || null,
      status,
      author_id: doctorId,
      reading_time_minutes: readingTime
    }
  });

  return article;
}

export async function updateArticle(
  doctorId: string,
  articleId: string,
  input: UpdateArticleInput
) {
  const existing = await prisma.article.findUnique({
    where: { id: articleId }
  });

  if (!existing) {
    throw new AppError("Article not found", 404, "NOT_FOUND");
  }

  if (existing.author_id !== doctorId) {
    throw new AppError(
      "You do not have permission to edit this article",
      403,
      "FORBIDDEN"
    );
  }

  if (existing.status === "published") {
    throw new AppError(
      "Published articles cannot be directly edited. Contact FCN Admin.",
      400,
      "CANNOT_EDIT_PUBLISHED"
    );
  }

  if (existing.status === "pending_review" && input.status !== "draft") {
    throw new AppError(
      "Article is currently under review by FCN Admin. You can withdraw it to draft to edit.",
      400,
      "UNDER_REVIEW"
    );
  }

  const data: any = {};
  if (input.title !== undefined) {
    data.title = input.title;
    if (existing.status === "draft") {
      data.slug = await generateUniqueSlug(input.title, existing.id);
    }
  }
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.content !== undefined) {
    data.content = input.content;
    data.reading_time_minutes = calculateReadingTimeMinutes(input.content);
  }
  if (input.category !== undefined) data.category = input.category;
  if (input.cover_image_url !== undefined) {
    data.cover_image_url = input.cover_image_url || null;
  }

  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === "pending_review") {
      data.rejection_reason = null;
    }
  }

  const updated = await prisma.article.update({
    where: { id: articleId },
    data
  });

  return updated;
}

export async function deleteArticle(doctorId: string, articleId: string) {
  const existing = await prisma.article.findUnique({
    where: { id: articleId }
  });

  if (!existing) {
    throw new AppError("Article not found", 404, "NOT_FOUND");
  }

  if (existing.author_id !== doctorId) {
    throw new AppError(
      "You do not have permission to delete this article",
      403,
      "FORBIDDEN"
    );
  }

  if (existing.status === "published") {
    throw new AppError(
      "Published articles cannot be deleted directly. Request unpublishing from FCN Admin.",
      400,
      "CANNOT_DELETE_PUBLISHED"
    );
  }

  await prisma.article.delete({
    where: { id: articleId }
  });

  return { deleted: true };
}

export async function getAdminArticles(query: ArticleQueryParams) {
  const { page = 1, limit = 15, status, category, search } = query;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (category && category !== "All") {
    where.category = { equals: category, mode: "insensitive" };
  }
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { title: { contains: term, mode: "insensitive" } },
      { excerpt: { contains: term, mode: "insensitive" } },
      {
        author: {
          user: { full_name: { contains: term, mode: "insensitive" } }
        }
      }
    ];
  }

  const total = await prisma.article.count({ where });
  const articles = await prisma.article.findMany({
    where,
    skip,
    take: limit,
    orderBy: { created_at: "desc" },
    include: {
      author: {
        select: {
          user_id: true,
          license_number: true,
          specialty: true,
          verified: true,
          years_experience: true,
          photo_url: true,
          hospital: { select: { name: true } },
          user: { select: { id: true, full_name: true, email: true, phone: true } }
        }
      }
    }
  });
  const statsGroup = await prisma.article.groupBy({
    by: ["status"],
    _count: { _all: true }
  });

  const stats: Record<string, number> = {
    total: 0,
    pending_review: 0,
    published: 0,
    rejected: 0,
    draft: 0
  };

  for (const group of statsGroup) {
    stats[group.status] = group._count._all;
    stats.total += group._count._all;
  }

  return {
    articles,
    stats,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function moderateArticle(
  _adminId: string,
  articleId: string,
  input: ModerateArticleInput
) {
  const existing = await prisma.article.findUnique({
    where: { id: articleId }
  });

  if (!existing) {
    throw new AppError("Article not found", 404, "NOT_FOUND");
  }

  let data: any = {};

  if (input.status === "published") {
    data = {
      status: "published",
      published_at: existing.published_at || new Date(),
      rejection_reason: null
    };
  } else if (input.status === "rejected") {
    data = {
      status: "rejected",
      rejection_reason: input.rejection_reason,
      published_at: null
    };
  }

  const updated = await prisma.article.update({
    where: { id: articleId },
    data,
    include: {
      author: {
        select: {
          user_id: true,
          specialty: true,
          user: { select: { full_name: true, email: true } }
        }
      }
    }
  });

  return updated;
}

export async function uploadArticleImage(
  doctorId: string,
  buffer: Buffer
): Promise<{ url: string; public_id: string }> {
  const { cloudinaryService } = await import("../../services/cloudinary.service");
  return cloudinaryService.uploadArticleImage(buffer, `art-${doctorId}`);
}

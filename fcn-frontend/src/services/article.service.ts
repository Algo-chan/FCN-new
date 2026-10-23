import { api } from "@/services/api";
import type {
  AdminArticleListResponse,
  ApiResponse,
  Article,
  ArticleListResponse,
  ArticleQueryParams,
  CreateArticleInput,
  DoctorArticleListResponse,
  ModerateArticleInput,
  UpdateArticleInput
} from "@/types";

export const articleService = {
  // Public
  getPublishedArticles: (params?: ArticleQueryParams) =>
    api
      .get<ApiResponse<ArticleListResponse>>("/articles", { params })
      .then((r) => r.data.data),

  getArticleBySlug: (slug: string) =>
    api
      .get<ApiResponse<Article>>(`/articles/${slug}`)
      .then((r) => r.data.data),

  // Doctor
  getDoctorArticles: (params?: ArticleQueryParams) =>
    api
      .get<ApiResponse<DoctorArticleListResponse>>("/articles/my", { params })
      .then((r) => r.data.data),

  createArticle: (input: CreateArticleInput) =>
    api
      .post<ApiResponse<Article>>("/articles", input)
      .then((r) => r.data.data),

  updateArticle: (id: string, input: UpdateArticleInput) =>
    api
      .put<ApiResponse<Article>>(`/articles/${id}`, input)
      .then((r) => r.data.data),

  deleteArticle: (id: string) =>
    api
      .delete<ApiResponse<{ deleted: boolean }>>(`/articles/${id}`)
      .then((r) => r.data.data),

  // Super Admin
  getAdminArticles: (params?: ArticleQueryParams) =>
    api
      .get<ApiResponse<AdminArticleListResponse>>("/admin/articles", { params })
      .then((r) => r.data.data),

  moderateArticle: (id: string, input: ModerateArticleInput) =>
    api
      .patch<ApiResponse<Article>>(`/admin/articles/${id}/status`, input)
      .then((r) => r.data.data)
};

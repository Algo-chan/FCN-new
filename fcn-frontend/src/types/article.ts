export type ArticleStatus = "draft" | "pending_review" | "published" | "rejected";

export interface ArticleAuthor {
  user_id: string;
  specialty: string;
  license_number?: string;
  photo_url?: string | null;
  verified: boolean;
  years_experience?: number;
  consultation_fee_etb: number;
  rating_average?: number;
  rating_count?: number;
  bio?: string | null;
  city?: string | null;
  hospital?: {
    id?: string;
    name: string;
    location?: string;
  } | null;
  user: {
    id?: string;
    full_name: string;
    email?: string;
    phone?: string | null;
  };
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image_url?: string | null;
  category: string;
  author_id: string;
  status: ArticleStatus;
  rejection_reason?: string | null;
  views_count: number;
  reading_time_minutes: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  author?: ArticleAuthor;
}

export interface ArticlePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ArticleListResponse {
  articles: Article[];
  pagination: ArticlePagination;
}

export interface DoctorArticleListResponse extends ArticleListResponse {
  stats: {
    total: number;
    published: number;
    pending_review: number;
    draft: number;
    rejected: number;
    total_views: number;
  };
}

export interface AdminArticleListResponse extends ArticleListResponse {
  stats: {
    total: number;
    pending_review: number;
    published: number;
    rejected: number;
    draft: number;
  };
}

export interface ArticleQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  status?: ArticleStatus;
}

export interface CreateArticleInput {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image_url?: string | null;
  status?: "draft" | "pending_review";
}

export interface UpdateArticleInput {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  cover_image_url?: string | null;
  status?: "draft" | "pending_review";
}

export interface ModerateArticleInput {
  status: "published" | "rejected";
  rejection_reason?: string;
}

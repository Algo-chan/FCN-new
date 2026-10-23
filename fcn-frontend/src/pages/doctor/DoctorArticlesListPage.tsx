import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Trash2,
  ExternalLink,
  Send,
  Search,
  Sparkles,
  Check
} from "lucide-react";
import { articleService } from "@/services/article.service";
import { Spinner } from "@/components/ui/Spinner";
import type { ArticleStatus } from "@/types";
import toast from "react-hot-toast";

export const DoctorArticlesListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const statusParam =
    activeTab === "all"
      ? undefined
      : (activeTab as ArticleStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-articles", statusParam, searchTerm],
    queryFn: () =>
      articleService.getDoctorArticles({
        status: statusParam,
        search: searchTerm || undefined,
        limit: 50
      })
  });

  const deleteMutation = useMutation({
    mutationFn: (articleId: string) => articleService.deleteArticle(articleId),
    onSuccess: () => {
      toast.success("Article deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["doctor-articles"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || "Failed to delete article");
    }
  });

  const submitForReviewMutation = useMutation({
    mutationFn: (articleId: string) =>
      articleService.updateArticle(articleId, { status: "pending_review" }),
    onSuccess: () => {
      toast.success("Article submitted for FCN Super Admin review!");
      queryClient.invalidateQueries({ queryKey: ["doctor-articles"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || "Failed to submit article");
    }
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const articles = data?.articles ?? [];
  const stats = data?.stats ?? {
    total: 0,
    published: 0,
    pending_review: 0,
    draft: 0,
    rejected: 0,
    total_views: 0
  };

  const getStatusBadge = (status: ArticleStatus) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Published Live
          </span>
        );
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            Under FCN Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="h-3 w-3" />
            Revisions Requested
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <FileEdit className="h-3 w-3" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Medical Articles Studio
            </h1>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-500/20">
              Doctor Authoring
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Publish clinical awareness guides. Every published article features your doctor booking
            dock, converting readers directly into patients.
          </p>
        </div>

        <Link
          to="/doctor/articles/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:from-teal-600 hover:to-emerald-700 active:scale-95 transition-all shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Write New Article</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Articles</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Published Live</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.published}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Under Review</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.pending_review}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">Total Patient Views</p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{stats.total_views}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80 overflow-x-auto">
          {[
            { id: "all", label: "All", count: stats.total },
            { id: "published", label: "Published", count: stats.published },
            { id: "pending_review", label: "Under Review", count: stats.pending_review },
            { id: "draft", label: "Drafts", count: stats.draft },
            { id: "rejected", label: "Needs Revisions", count: stats.rejected }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span className="rounded-full bg-slate-200/60 px-1.5 py-0.2 text-[10px] dark:bg-slate-700">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Articles List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : articles.length > 0 ? (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm hover:border-teal-500/30 transition-all dark:border-white/10 dark:bg-slate-900"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {getStatusBadge(article.status)}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {article.category}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.reading_time_minutes} min read
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {article.views_count} views
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {article.excerpt}
                  </p>

                  {/* Rejection / Feedback Note if rejected */}
                  {article.status === "rejected" && article.rejection_reason && (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/30 dark:text-rose-300">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>FCN Admin Review Feedback:</strong> {article.rejection_reason}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  {article.status === "published" && (
                    <Link
                      to={`/articles/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View Live</span>
                    </Link>
                  )}

                  {article.status !== "published" && (
                    <Link
                      to={`/doctor/articles/${article.id}/edit`}
                      className="flex items-center gap-1 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300"
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Link>
                  )}

                  {(article.status === "draft" || article.status === "rejected") && (
                    <button
                      onClick={() => submitForReviewMutation.mutate(article.id)}
                      disabled={submitForReviewMutation.isPending}
                      className="flex items-center gap-1 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit for Review</span>
                    </button>
                  )}

                  {(article.status === "draft" || article.status === "rejected") && (
                    <button
                      onClick={() => handleDelete(article.id, article.title)}
                      disabled={deleteMutation.isPending}
                      className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      title="Delete draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 mb-4">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {searchTerm
              ? `No articles match "${searchTerm}"`
              : activeTab !== "all"
              ? `No ${activeTab.replace("_", " ")} articles found`
              : "You haven't written any articles yet"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Share your medical knowledge with Ethiopian patients. Articles are verified by FCN Admins
            and feature your direct consultation booking button.
          </p>
          <Link
            to="/doctor/articles/new"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Write Your First Article</span>
          </Link>
        </div>
      )}
    </div>
  );
};

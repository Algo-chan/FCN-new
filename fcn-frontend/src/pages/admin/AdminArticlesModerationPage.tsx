import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  ExternalLink,
  ShieldCheck,
  Stethoscope,
  Filter,
  Check
} from "lucide-react";
import { articleService } from "@/services/article.service";
import { ArticlePreviewModal } from "@/components/admin/ArticlePreviewModal";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { MASTER_SPECIALTIES } from "@/constants/specialties";
import type { Article, ArticleStatus } from "@/types";
import toast from "react-hot-toast";

export const AdminArticlesModerationPage = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("pending_review");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  const statusParam =
    selectedStatus === "all"
      ? undefined
      : (selectedStatus as ArticleStatus);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-articles", statusParam, searchTerm, selectedCategory],
    queryFn: () =>
      articleService.getAdminArticles({
        status: statusParam,
        search: searchTerm || undefined,
        category: selectedCategory === "All" ? undefined : selectedCategory,
        limit: 50
      })
  });

  const moderateMutation = useMutation({
    mutationFn: ({
      articleId,
      status,
      rejectionReason
    }: {
      articleId: string;
      status: "published" | "rejected";
      rejectionReason?: string;
    }) =>
      articleService.moderateArticle(articleId, {
        status,
        rejection_reason: rejectionReason
      }),
    onSuccess: (updatedArticle) => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      if (updatedArticle && updatedArticle.status === "published") {
        toast.success(`"${updatedArticle.title}" approved and published live!`);
      } else {
        toast.success("Revision request sent to the authoring doctor.");
      }
      setPreviewArticle(null);
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error?.message || "Failed to update article status"
      );
    }
  });

  const handleApprove = async (articleId: string) => {
    await moderateMutation.mutateAsync({ articleId, status: "published" });
  };

  const handleReject = async (articleId: string, reason: string) => {
    await moderateMutation.mutateAsync({
      articleId,
      status: "rejected",
      rejectionReason: reason
    });
  };

  const articles = data?.articles ?? [];
  const stats = data?.stats ?? {
    total: 0,
    pending_review: 0,
    published: 0,
    rejected: 0,
    draft: 0
  };

  const getStatusBadge = (status: ArticleStatus) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Published
          </span>
        );
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <Clock className="h-3 w-3" />
            Pending Review
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="h-3 w-3" />
            Changes Requested
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Article Moderation Queue
            </h1>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-500/20">
              FCN Super Admin
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review and approve clinical health guides written by registered Ethiopian physicians
            before they are indexed on Google.
          </p>
        </div>

        <Link
          to="/articles"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>View Public Directory</span>
        </Link>
      </div>

      {/* Filter Tabs & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80 overflow-x-auto">
          {[
            { id: "pending_review", label: "Pending Review", count: stats.pending_review, highlight: true },
            { id: "published", label: "Published", count: stats.published },
            { id: "rejected", label: "Changes Requested", count: stats.rejected },
            { id: "all", label: "All Articles", count: stats.total }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                selectedStatus === tab.id
                  ? tab.highlight && tab.count > 0
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  selectedStatus === tab.id && tab.highlight
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/60 dark:bg-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search title, doctor..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm focus:border-teal-500 focus:outline-none dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="All">All Specialties</option>
            {MASTER_SPECIALTIES.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Moderation Queue Table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : articles.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider dark:border-white/5 dark:bg-slate-800/40">
                <tr>
                  <th className="py-4 pl-6 pr-4">Article</th>
                  <th className="py-4 px-4">Author Physician</th>
                  <th className="py-4 px-4">Specialty</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Submitted</th>
                  <th className="py-4 pl-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {articles.map((article) => {
                  const author = article.author;
                  const authorName = author?.user?.full_name || "Doctor";

                  return (
                    <tr
                      key={article.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Title & Excerpt */}
                      <td className="py-4 pl-6 pr-4 max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {article.title}
                        </p>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {article.excerpt}
                        </p>
                      </td>

                      {/* Author */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            Dr. {authorName.replace(/^Dr\.?\s*/i, "")}
                          </span>
                          {author?.verified && (
                            <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" />
                          )}
                        </div>
                        {author?.license_number && (
                          <span className="font-mono text-[10px] text-slate-400">
                            {author.license_number}
                          </span>
                        )}
                      </td>

                      {/* Specialty */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {article.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(article.status)}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {new Date(article.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewArticle(article)}
                            className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 transition-colors"
                          >
                            Review & Moderate
                          </button>

                          {article.status === "pending_review" && (
                            <button
                              onClick={() => handleApprove(article.id)}
                              disabled={moderateMutation.isPending}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                            >
                              Quick Approve
                            </button>
                          )}

                          {article.status === "published" && (
                            <Link
                              to={`/articles/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
                              title="View on public site"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 mb-4">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Moderation Queue Clear
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {selectedStatus === "pending_review"
              ? "All submitted doctor articles have been reviewed and processed."
              : "No articles found matching this filter."}
          </p>
        </div>
      )}

      {/* Full Article Review Inspector Modal */}
      <ArticlePreviewModal
        article={previewArticle}
        isOpen={Boolean(previewArticle)}
        onClose={() => setPreviewArticle(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={moderateMutation.isPending}
      />
    </div>
  );
};

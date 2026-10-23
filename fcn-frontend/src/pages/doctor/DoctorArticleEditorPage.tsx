import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { articleService } from "@/services/article.service";
import { ArticleEditor } from "@/components/articles/ArticleEditor";
import { Spinner } from "@/components/ui/Spinner";
import type { CreateArticleInput } from "@/types";
import toast from "react-hot-toast";

export const DoctorArticleEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  // If editing, load doctor's articles to find this article
  const { data, isLoading } = useQuery({
    queryKey: ["doctor-article-edit", id],
    queryFn: async () => {
      const res = await articleService.getDoctorArticles({ limit: 100 });
      return res?.articles?.find((a) => a.id === id);
    },
    enabled: isEditing
  });

  const mutation = useMutation({
    mutationFn: async ({
      data,
      action
    }: {
      data: CreateArticleInput;
      action: "draft" | "pending_review";
    }) => {
      if (isEditing && id) {
        return articleService.updateArticle(id, { ...data, status: action });
      } else {
        return articleService.createArticle({ ...data, status: action });
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-articles"] });
      if (variables.action === "pending_review") {
        toast.success("Article submitted for FCN Super Admin review!");
      } else {
        toast.success("Article draft saved successfully");
      }
      navigate("/doctor/articles");
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error?.message || "Failed to save article"
      );
    }
  });

  const handleSubmit = async (
    data: CreateArticleInput,
    action: "draft" | "pending_review"
  ) => {
    await mutation.mutateAsync({ data, action });
  };

  if (isEditing && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Back link */}
      <div className="flex items-center justify-between">
        <Link
          to="/doctor/articles"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Articles</span>
        </Link>

        <span className="text-xs font-semibold text-slate-400">
          {isEditing ? "Editing Article" : "New Article Draft"}
        </span>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          {isEditing ? "Edit Clinical Article" : "Write Clinical Article"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Craft evidence-based health articles for Ethiopian patients. Provide structured headings,
          dietary advice, and key medical warnings.
        </p>
      </div>

      {/* Article Editor Component */}
      <ArticleEditor
        initialValues={data}
        onSubmit={handleSubmit}
        isSubmitting={mutation.isPending}
        isEditing={isEditing}
      />
    </div>
  );
};

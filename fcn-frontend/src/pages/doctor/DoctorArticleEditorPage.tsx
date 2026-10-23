import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { articleService } from "@/services/article.service";
import { ArticleEditor } from "@/components/articles/ArticleEditor";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
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
      <PageHeader
        backButton={{
          to: "/doctor/articles",
          label: "Back to Articles"
        }}
        icon={BookOpen}
        iconVariant="teal"
        title={isEditing ? "Edit Clinical Article" : "Write Clinical Article"}
        description="Craft evidence-based health articles for Ethiopian patients. Provide structured headings, dietary advice, and key medical warnings."
        badge={
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
            {isEditing ? "Draft Revision" : "New Draft"}
          </span>
        }
      />

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

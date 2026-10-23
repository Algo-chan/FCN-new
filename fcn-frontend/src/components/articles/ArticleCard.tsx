import { Link } from "react-router-dom";
import { Clock, Eye, CheckCircle2, Stethoscope, Calendar } from "lucide-react";
import type { Article } from "@/types";
import { getInitials } from "@/utils/formatters";

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export const ArticleCard = ({ article, featured = false }: ArticleCardProps) => {
  const authorName = article.author?.user?.full_name || "Doctor";
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "Recently published";

  const fallbackImage =
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80";

  if (featured) {
    return (
      <Link
        to={`/articles/${article.slug}`}
        className="group relative grid grid-cols-1 md:grid-cols-12 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm hover:shadow-xl hover:border-teal-500/40 transition-all duration-300 dark:border-white/10 dark:bg-slate-900"
      >
        <div className="relative md:col-span-7 h-64 md:h-full min-h-[280px] overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={article.cover_image_url || fallbackImage}
            alt={article.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="rounded-full bg-teal-600/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-sm">
              Featured Clinical Guide
            </span>
          </div>
        </div>

        <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
              <span className="font-semibold text-teal-600 dark:text-teal-400">
                {article.category}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {article.reading_time_minutes} min read
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {article.views_count}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-3 leading-snug dark:text-white dark:group-hover:text-teal-400">
              {article.title}
            </h2>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
              {article.excerpt}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-xs font-bold text-white">
                  {article.author?.photo_url ? (
                    <img
                      src={article.author.photo_url}
                      alt={authorName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(authorName)
                  )}
                </div>
                {article.author?.verified && (
                  <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 fill-emerald-500 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  Dr. {authorName.replace(/^Dr\.?\s*/i, "")}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {article.author?.specialty || "Specialist"}
                </p>
              </div>
            </div>

            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
              {formattedDate}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/articles/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:shadow-lg hover:border-teal-500/40 hover:-translate-y-1 transition-all duration-300 dark:border-white/10 dark:bg-slate-900"
    >
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={article.cover_image_url || fallbackImage}
          alt={article.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-teal-700 shadow-sm dark:bg-slate-900/90 dark:text-teal-300">
            {article.category}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {article.reading_time_minutes} min read
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-2 leading-snug dark:text-white dark:group-hover:text-teal-400">
            {article.title}
          </h3>

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
            {article.excerpt}
          </p>
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-[10px] font-bold text-white">
                {article.author?.photo_url ? (
                  <img
                    src={article.author.photo_url}
                    alt={authorName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(authorName)
                )}
              </div>
              {article.author?.verified && (
                <CheckCircle2 className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-emerald-500 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                Dr. {authorName.replace(/^Dr\.?\s*/i, "")}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-0.5">
                <Stethoscope className="h-2.5 w-2.5 text-teal-500" />
                {article.author?.specialty}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <Eye className="h-3 w-3" />
            <span>{article.views_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

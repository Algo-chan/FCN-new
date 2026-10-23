import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Eye,
  Calendar,
  Share2,
  CheckCircle2,
  Stethoscope,
  ArrowLeft,
  CalendarPlus,
  Hospital,
  MapPin,
  Star,
  ShieldCheck,
  Check
} from "lucide-react";
import { articleService } from "@/services/article.service";
import { FloatingDoctorDock } from "@/components/articles/FloatingDoctorDock";
import { ArticleJsonLd } from "@/components/articles/ArticleJsonLd";
import { Spinner } from "@/components/ui/Spinner";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { getInitials } from "@/utils/formatters";
import toast from "react-hot-toast";

export const ArticleDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  // Scroll Progress Listener
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ["article-detail", slug],
    queryFn: () => articleService.getArticleBySlug(slug!),
    enabled: Boolean(slug)
  });

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // User cancelled share
    }
  };

  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      const italicParts = part.split(/(\*[^*]+\*)/g);
      return italicParts.map((sub, j) => {
        if (sub.startsWith("*") && sub.endsWith("*")) {
          return <em key={`${i}-${j}`}>{sub.slice(1, -1)}</em>;
        }
        return sub;
      });
    });
  };

  const renderArticleContent = (content: string) => {
    const blocks = content.split(/\n\s*\n/);

    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // H2
      if (trimmed.startsWith("## ")) {
        return (
          <h2
            key={idx}
            className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-12 mb-4 tracking-tight leading-snug border-b border-slate-100 pb-3 dark:border-white/10"
          >
            {trimmed.replace(/^##\s+/, "")}
          </h2>
        );
      }

      // H3
      if (trimmed.startsWith("### ")) {
        return (
          <h3
            key={idx}
            className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-3 tracking-tight"
          >
            {trimmed.replace(/^###\s+/, "")}
          </h3>
        );
      }

      // Blockquote / Clinical Callout
      if (trimmed.startsWith("> ")) {
        return (
          <div
            key={idx}
            className="my-8 rounded-2xl border-l-4 border-teal-500 bg-teal-50/70 p-5 text-sm sm:text-base leading-relaxed text-teal-950 dark:border-teal-400 dark:bg-teal-950/40 dark:text-teal-200 shadow-sm"
          >
            {formatInline(trimmed.replace(/^>\s*/, ""))}
          </div>
        );
      }

      // Bullet list
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const items = trimmed
          .split("\n")
          .filter((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "));
        return (
          <ul key={idx} className="my-5 space-y-3 pl-2">
            {items.map((item, itemIdx) => (
              <li
                key={itemIdx}
                className="flex items-start gap-3 text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                <span className="mt-2.5 h-2 w-2 rounded-full bg-teal-500 shrink-0" />
                <span>{formatInline(item.replace(/^[-*]\s+/, ""))}</span>
              </li>
            ))}
          </ul>
        );
      }

      // Numbered list
      if (/^\d+\.\s/.test(trimmed)) {
        const items = trimmed.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()));
        return (
          <ol key={idx} className="my-5 space-y-3 pl-2 list-none">
            {items.map((item, itemIdx) => {
              const match = item.match(/^(\d+)\.\s+(.*)/);
              const num = match ? match[1] : itemIdx + 1;
              const text = match ? match[2] : item;
              return (
                <li
                  key={itemIdx}
                  className="flex items-start gap-3 text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/60 text-xs font-bold text-teal-800 dark:text-teal-300 shrink-0 mt-0.5">
                    {num}
                  </span>
                  <span>{formatInline(text)}</span>
                </li>
              );
            })}
          </ol>
        );
      }

      // Standard paragraph
      return (
        <p
          key={idx}
          className="my-5 text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed sm:leading-loose"
        >
          {formatInline(trimmed)}
        </p>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Article Not Found
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The requested article may have been unpublished or moved.
        </p>
        <Link
          to="/articles"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-teal-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Articles</span>
        </Link>
      </div>
    );
  }

  const author = article.author;
  const authorName = author?.user?.full_name || "Doctor";
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      })
    : "Recently published";

  const fallbackImage =
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1400&q=80";

  return (
    <div className="min-h-screen bg-slate-50/40 pb-36 dark:bg-slate-950 flex flex-col">
      <Navbar />

      {/* Schema.org MedicalWebPage JSON-LD for Google SEO */}
      <ArticleJsonLd article={article} />

      {/* Reading Progress Bar pinned directly below the fixed navbar */}
      <div
        className="fixed top-16 left-0 h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-500 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Top Header & Breadcrumb */}
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 pt-20 sm:pt-24 pb-4">
        <div className="flex items-center justify-between text-xs">
          <Link
            to="/articles"
            className="flex items-center gap-1.5 font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Health Guides</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Guide</span>
              </>
            )}
          </button>
        </div>

        {/* Category & Meta */}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full bg-teal-500/10 px-3 py-1 font-bold text-teal-700 dark:bg-teal-500/20 dark:text-teal-300 border border-teal-500/20">
            {article.category}
          </span>
          <span className="text-slate-400">•</span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {article.reading_time_minutes} min read
          </span>
          <span className="text-slate-400">•</span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
          <span className="text-slate-400">•</span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Eye className="h-3.5 w-3.5" />
            {article.views_count} views
          </span>
        </div>

        {/* Title */}
        <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          {article.title}
        </h1>

        {/* Excerpt Lead Paragraph */}
        <p className="mt-6 border-l-4 border-teal-500 pl-4 text-lg sm:text-xl font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
          {article.excerpt}
        </p>

        {/* Author Byline Card (Top) */}
        {author && (
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-sm font-bold text-white shadow-sm overflow-hidden border-2 border-teal-500">
                  {author.photo_url ? (
                    <img
                      src={author.photo_url}
                      alt={authorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(authorName)}</span>
                  )}
                </div>
                {author.verified && (
                  <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 fill-emerald-500 text-white" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Dr. {authorName.replace(/^Dr\.?\s*/i, "")}
                  </p>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Verified Physician
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {author.specialty}
                  {author.hospital?.name ? ` • ${author.hospital.name}` : ""}
                </p>
              </div>
            </div>

            <Link
              to={`/appointments/book?doctor=${author.user_id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700 transition-colors shrink-0"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              <span>Book Dr. {authorName.split(" ")[0]}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Hero Cover Image */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 mt-6">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-slate-100 shadow-md dark:bg-slate-800">
          <img
            src={article.cover_image_url || fallbackImage}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Article Body */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 mt-10">
        <div className="prose prose-slate prose-lg max-w-none dark:prose-invert">
          {renderArticleContent(article.content)}
        </div>

        {/* Medical Awareness Disclaimer */}
        <div className="mt-12 rounded-3xl border border-amber-200/80 bg-amber-50/70 p-6 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>Medical Disclaimer:</strong> This article is authored by a licensed Ethiopian
              physician for general clinical awareness. It does not replace individualized diagnosis,
              laboratory investigation, or direct prescription from your personal healthcare provider.
            </div>
          </div>
        </div>

        {/* Detailed Author Profile Box (Bottom Conversion Section) */}
        {author && (
          <section className="mt-12 rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="relative shrink-0">
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-lg font-bold text-white shadow overflow-hidden border-2 border-teal-500">
                  {author.photo_url ? (
                    <img
                      src={author.photo_url}
                      alt={authorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(authorName)}</span>
                  )}
                </div>
                {author.verified && (
                  <CheckCircle2 className="absolute -bottom-1 -right-1 h-5 w-5 fill-emerald-500 text-white" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Dr. {authorName.replace(/^Dr\.?\s*/i, "")}
                  </h3>
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                    {author.specialty}
                  </span>
                </div>

                {author.hospital?.name && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Hospital className="h-3.5 w-3.5 text-slate-400" />
                    <span>{author.hospital.name}</span>
                    {author.hospital.location && (
                      <>
                        <span>•</span>
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        <span>{author.hospital.location}</span>
                      </>
                    )}
                  </p>
                )}

                {author.bio && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {author.bio}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-white/10">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Consultation Fee:{" "}
                    <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
                      {author.consultation_fee_etb} ETB
                    </span>
                  </div>

                  <Link
                    to={`/appointments/book?doctor=${author.user_id}`}
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-teal-600 hover:to-emerald-700 transition-all active:scale-95"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    <span>Schedule Consultation</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </article>

      {/* Option A Sticky Floating Doctor Dock */}
      {author && <FloatingDoctorDock author={author} />}

      <Footer />
    </div>
  );
};

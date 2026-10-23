import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  BookOpen,
  Filter,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { articleService } from "@/services/article.service";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { MASTER_SPECIALTIES } from "@/constants/specialties";
import { Spinner } from "@/components/ui/Spinner";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const ArticlesDirectoryPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  const categories = ["All", ...MASTER_SPECIALTIES];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-articles", selectedCategory, searchQuery, page],
    queryFn: () =>
      articleService.getPublishedArticles({
        category: selectedCategory === "All" ? undefined : selectedCategory,
        search: searchQuery || undefined,
        page,
        limit: 12
      })
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const articles = data?.articles ?? [];
  const pagination = data?.pagination;
  const hasArticles = articles.length > 0;
  const showFeatured = page === 1 && !searchQuery && selectedCategory === "All" && hasArticles;
  const featuredArticle = showFeatured ? articles[0] : null;
  const standardArticles = showFeatured ? articles.slice(1) : articles;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col dark:bg-slate-950">
      <Navbar />
      <div className="flex-1 pt-16">
        {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-teal-500/10 via-white to-transparent py-12 md:py-16 dark:border-white/10 dark:from-teal-950/20 dark:via-slate-900 dark:to-transparent">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-50/80 px-3 py-1 text-xs font-bold text-teal-800 shadow-sm dark:border-teal-500/20 dark:bg-teal-950/50 dark:text-teal-300 mb-4">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Medically Verified by Ethiopian Doctors</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Clinical Health Guides &{" "}
              <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-sky-600 bg-clip-text text-transparent">
                Medical Insights
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Evidence-based healthcare awareness written by certified Ethiopian specialists.
              Explore chronic disease management, pediatric care, nutrition, and first aid tips.
            </p>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="mt-8 max-w-xl">
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search articles by title, topic, or symptoms (e.g. Diabetes, Fever, Blood Pressure)..."
                  className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-24 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-20 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Category Pills Scroller */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none overscroll-contain">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-teal-500/40 hover:text-teal-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-500/40 dark:hover:text-teal-400"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex h-64 items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
              Failed to load articles. Please refresh the page.
            </p>
          </div>
        )}

        {/* Content Listing */}
        {!isLoading && !isError && (
          <div>
            {/* Featured Article on first page */}
            {featuredArticle && (
              <div className="mb-10">
                <ArticleCard article={featuredArticle} featured={true} />
              </div>
            )}

            {/* Articles Grid */}
            {standardArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {standardArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : !featuredArticle ? (
              /* Empty State */
              <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-white/10 dark:bg-slate-900">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400 mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  No medical articles found
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery
                    ? `No guides match your search "${searchQuery}". Try different medical keywords.`
                    : "No articles are available in this specialty yet."}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    clearSearch();
                  }}
                  className="mt-5 rounded-full bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-teal-700 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : null}

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm disabled:opacity-40 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm disabled:opacity-40 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Doctor Recruitment / Author Callout Banner */}
        <section className="mt-16 overflow-hidden rounded-3xl border border-teal-500/30 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 p-8 sm:p-10 text-white shadow-xl relative">
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold text-teal-300 mb-3 border border-teal-500/30">
              <Stethoscope className="h-3.5 w-3.5" />
              For Ethiopian Medical Doctors
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Publish Clinical Insights & Expand Your Practice
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Educate the public on critical health conditions while connecting with patients across Ethiopia.
              Every published article features your verified doctor booking dock, driving direct remote and in-person consultations.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-teal-500/25 hover:from-teal-600 hover:to-emerald-600 transition-all active:scale-95"
              >
                <span>Register as a Doctor</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/doctor/articles"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-xs sm:text-sm font-bold text-white backdrop-blur hover:bg-white/20 transition-all"
              >
                <span>Doctor Writing Studio</span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      </div>
      <Footer />
    </div>
  );
};

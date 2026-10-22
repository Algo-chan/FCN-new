import { useCallback, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Frown, Sparkles } from "lucide-react";
import { doctorsService } from "@/services/doctors.service";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { DoctorDetailModal } from "@/components/doctors/DoctorDetailModal";
import { DoctorFilters, EMPTY_FILTERS, type FilterState } from "@/components/doctors/DoctorFilters";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageTransition } from "@/components/animations/PageTransition";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useAuthStore } from "@/store/auth.store";
import { useInstantConsultStore } from "@/store/instant-consult.store";
import { InstantConsultOverlay } from "@/components/instant-consult/InstantConsultOverlay";
import type { PublicDoctorDetail } from "@/types";

const SkeletonCard = () => (
  <div className="rounded-[22px] border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/90 overflow-hidden animate-pulse">
    <div className="h-44 bg-slate-200 dark:bg-slate-800" />
    <div className="p-4 sm:p-5 space-y-3">
      <div className="h-5 w-40 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-3 w-28 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="h-4 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
        <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-11 w-full rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </div>
  </div>
);

const FindDoctorsPage = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const openInstantConsult = useInstantConsultStore((state) => state.openInstantConsult);

  const [filters, setFilters] = useState<FilterState>(() => ({
    search: searchParams.get("search") ?? "",
    specialty: searchParams.get("specialty") ?? "",
    hospital_id: searchParams.get("hospital_id") ?? "",
    city: searchParams.get("city") ?? "",
    language: searchParams.get("language") ?? "",
    min_fee: searchParams.get("min_fee") ?? "",
    max_fee: searchParams.get("max_fee") ?? "",
    available_today: searchParams.get("available_today") === "true",
    verified_only: searchParams.get("verified_only") === "true",
  }));

  const [page, setPage] = useState(() => {
    const p = searchParams.get("page");
    return p ? parseInt(p, 10) : 1;
  });

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const updateFilters = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      setPage(1);
      const params = new URLSearchParams();
      if (newFilters.search) params.set("search", newFilters.search);
      if (newFilters.specialty) params.set("specialty", newFilters.specialty);
      if (newFilters.hospital_id) params.set("hospital_id", newFilters.hospital_id);
      if (newFilters.city) params.set("city", newFilters.city);
      if (newFilters.language) params.set("language", newFilters.language);
      if (newFilters.min_fee) params.set("min_fee", newFilters.min_fee);
      if (newFilters.max_fee) params.set("max_fee", newFilters.max_fee);
      if (newFilters.available_today) params.set("available_today", "true");
      if (newFilters.verified_only) params.set("verified_only", "true");
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  const queryParams = useMemo(
    () => ({
      search: filters.search || undefined,
      specialty: filters.specialty || undefined,
      hospital_id: filters.hospital_id || undefined,
      city: filters.city || undefined,
      language: filters.language || undefined,
      min_fee: filters.min_fee ? Number(filters.min_fee) : undefined,
      max_fee: filters.max_fee ? Number(filters.max_fee) : undefined,
      available_today: filters.available_today || undefined,
      verified_only: filters.verified_only || undefined,
      page,
      limit: 12,
    }),
    [filters, page]
  );

  const { data: doctorsResponse, isLoading } = useQuery({
    queryKey: ["doctors", queryParams],
    queryFn: () => doctorsService.getAllDoctors(queryParams),
  });

  const { data: doctorDetailData } = useQuery({
    queryKey: ["doctor", selectedDoctorId],
    queryFn: () => doctorsService.getDoctorById(selectedDoctorId!),
    enabled: !!selectedDoctorId,
  });

  const doctors = useMemo(() => doctorsResponse?.data ?? [], [doctorsResponse]);
  const meta = doctorsResponse?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  const selectedDoctor = useMemo<PublicDoctorDetail | null>(() => {
    if (!doctorDetailData?.data) return null;
    return doctorDetailData.data;
  }, [doctorDetailData]);

  const handleCloseDetail = useCallback(() => {
    setSelectedDoctorId(null);
  }, []);

  const pageContent = (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t("doctors.pageTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {t("doctors.pageSubtitle")}
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <LanguageSwitcher variant="pill" />
        </div>
      </div>

      {/* Upfront Transparent Pricing Banner */}
      <div className="rounded-2xl border border-teal-500/25 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-950/40 dark:via-emerald-950/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 font-black text-xl">
            💳
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Transparent Upfront Specialist Rates
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              Browse all verified Ethiopian doctors and view fees upfront. Consultations start from <strong>350 Br</strong> with zero hidden platform charges.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="action"
            size="sm"
            onClick={() => {
              if (!isAuthenticated) {
                navigate("/login", { state: { instant_consult: true } });
                return;
              }
              openInstantConsult();
            }}
            className="font-black shadow-md text-xs sm:text-sm min-h-[38px]"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-teal-200" />
            <span>See a Doctor Now</span>
          </Button>

          <div className="rounded-xl bg-white/90 dark:bg-slate-900/90 px-3 py-2 border border-teal-500/25 text-xs font-bold text-teal-700 dark:text-teal-300 shadow-xs">
            Rates: <span className="text-sm font-black text-slate-900 dark:text-white ml-1">from 350 Br</span>
          </div>
        </div>
      </div>

      {/* Filter Section Sticky on scroll */}
      <div className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-y border-slate-200/80 dark:border-white/10 sm:rounded-2xl sm:border sm:mx-0 sm:shadow-sm">
        <DoctorFilters filters={filters} onChange={updateFilters} />
      </div>

      {/* Results count indicator */}
      {meta && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">
          {doctors.length === 1
            ? t("doctors.showingOne")
            : t("doctors.showingMany", { count: doctors.length, total: meta.total })}
        </p>
      )}

      {/* Doctor Cards Grid */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : doctors.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 sm:py-24 text-center rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Frown className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t("doctors.noResultsTitle")}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm px-4">
              {t("doctors.noResultsHint")}
            </p>
            <Button
              variant="action"
              className="mt-5 min-h-[44px]"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setSearchParams({}, { replace: true });
              }}
            >
              {t("doctors.clearFilters")}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {doctors.map((doc, i) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                index={i}
                onClick={() => setSelectedDoctorId(doc.id)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-6">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            icon={<ChevronLeft className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">{t("common.previous")}</span>
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setPage(pageNum)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                  page === pageNum
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            icon={<ChevronRight className="h-4 w-4" />}
          >
            <span className="hidden sm:inline">{t("common.next")}</span>
          </Button>
        </div>
      )}
    </div>
  );

  if (isAuthenticated) {
    return (
      <PageLayout>
        {pageContent}
        <DoctorDetailModal
          doctor={selectedDoctor}
          isOpen={!!selectedDoctorId}
          onClose={handleCloseDetail}
        />
      </PageLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 pt-20 sm:pt-24 pb-16 sm:px-6 lg:px-8">
        <PageTransition>
          {pageContent}
        </PageTransition>
      </main>

      <DoctorDetailModal
        doctor={selectedDoctor}
        isOpen={!!selectedDoctorId}
        onClose={handleCloseDetail}
      />

      <InstantConsultOverlay />

      <Footer />
    </div>
  );
};

export default FindDoctorsPage;

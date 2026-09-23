import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Frown } from "lucide-react";
import { doctorsService } from "@/services/doctors.service";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { DoctorDetailModal } from "@/components/doctors/DoctorDetailModal";
import { DoctorFilters, EMPTY_FILTERS, type FilterState } from "@/components/doctors/DoctorFilters";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PageTransition } from "@/components/animations/PageTransition";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n";
import type { PublicDoctorDetail } from "@/types";

const SkeletonCard = () => (
  <Card className="animate-pulse overflow-hidden p-0">
    <div className="h-36 md:h-44 bg-fcn-primary/10" />
    <div className="p-4 space-y-3">
      <div className="h-5 w-32 rounded bg-fcn-primary/10" />
      <div className="h-3 w-24 rounded bg-fcn-primary/10" />
      <div className="h-4 w-20 rounded bg-fcn-primary/10" />
      <div className="flex justify-between pt-3 border-t border-fcn-primary/5">
        <div className="h-8 w-16 rounded bg-fcn-primary/10" />
        <div className="h-8 w-16 rounded bg-fcn-primary/10" />
        <div className="h-8 w-16 rounded bg-fcn-primary/10" />
      </div>
      <div className="h-9 w-full rounded bg-fcn-primary/10" />
    </div>
  </Card>
);

const FindDoctorsPage = () => {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, locale, setLocale } = useTranslation();

  const [filters, setFilters] = useState<FilterState>(() => ({
    search: searchParams.get("search") ?? "",
    specialty: searchParams.get("specialty") ?? "",
    hospital_id: searchParams.get("hospital_id") ?? "",
    city: searchParams.get("city") ?? "",
    language: searchParams.get("language") ?? "",
    min_fee: searchParams.get("min_fee") ?? "",
    max_fee: searchParams.get("max_fee") ?? "",
    available_today: searchParams.get("available_today") === "true",
    verified_only: searchParams.get("verified_only") === "true"
  }));

  const [page, setPage] = useState(() => {
    const p = searchParams.get("page");
    return p ? parseInt(p, 10) : 1;
  });

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const updateFilters = useCallback((newFilters: FilterState) => {
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
  }, [setSearchParams]);

  const queryParams = useMemo(() => ({
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
    limit: 12
  }), [filters, page]);

  const { data: doctorsResponse, isLoading } = useQuery({
    queryKey: ["doctors", queryParams],
    queryFn: () => doctorsService.getAllDoctors(queryParams)
  });

  const { data: doctorDetailData } = useQuery({
    queryKey: ["doctor", selectedDoctorId],
    queryFn: () => doctorsService.getDoctorById(selectedDoctorId!),
    enabled: !!selectedDoctorId
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

  return (
    <div className="min-h-screen bg-fcn-light text-fcn-text-light dark:bg-fcn-dark dark:text-fcn-text-dark">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <PageTransition>
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                  {t("doctors.pageTitle")}
                </h1>
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as "en" | "am")}
                  className="h-8 rounded-lg border border-fcn-primary/15 bg-white px-2 text-xs font-medium text-fcn-text-light outline-none dark:bg-fcn-dark dark:text-fcn-text-dark"
                  aria-label="Language"
                >
                  <option value="en">English</option>
                  <option value="am">አማርኛ</option>
                </select>
              </div>
            </div>
            <p className="text-xs md:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              {t("doctors.pageSubtitle")}
            </p>

            <div className="sticky top-16 z-30 -mx-3 px-3 py-3 bg-white/80 dark:bg-fcn-dark/80 backdrop-blur-md border-b border-fcn-primary/5 sm:-mx-4 sm:px-4">
              <DoctorFilters filters={filters} onChange={updateFilters} />
            </div>

            {meta && (
              <p className="text-xs md:text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                {doctors.length === 1
                  ? t("doctors.showingOne")
                  : t("doctors.showingMany", { count: doctors.length, total: meta.total })}
              </p>
            )}

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
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
                  className="flex flex-col items-center justify-center py-16 md:py-20"
                >
                  <div className="mb-4 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-fcn-primary/5">
                    <Frown className="h-8 w-8 md:h-10 md:w-10 text-fcn-primary/30" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    {t("doctors.noResultsTitle")}
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50 text-center max-w-sm px-4">
                    {t("doctors.noResultsHint")}
                  </p>
                  <Button
                    variant="secondary"
                    className="mt-4"
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
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
                >
                  <AnimatePresence>
                    {doctors.map((doc, i) => (
                      <DoctorCard
                        key={doc.id}
                        doctor={doc}
                        index={i}
                        onClick={() => setSelectedDoctorId(doc.id)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 md:gap-2 pt-4">
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
                      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition ${
                        page === pageNum
                          ? "bg-fcn-accent text-white"
                          : "text-fcn-text-light/60 hover:bg-fcn-primary/5 dark:text-fcn-text-dark/60"
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
        </PageTransition>
      </div>

      <DoctorDetailModal
        doctor={selectedDoctor}
        isOpen={!!selectedDoctorId}
        onClose={handleCloseDetail}
      />

      <Footer />
    </div>
  );
};

export default FindDoctorsPage;
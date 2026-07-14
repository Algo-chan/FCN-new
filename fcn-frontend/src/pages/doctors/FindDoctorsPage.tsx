import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Frown } from "lucide-react";
import { doctorsService } from "@/services/doctors.service";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { DoctorDetailModal } from "@/components/doctors/DoctorDetailModal";
import { DoctorFilters, type FilterState } from "@/components/doctors/DoctorFilters";
import { PageTransition } from "@/components/animations/PageTransition";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { DoctorWithProfile, DoctorFullProfile } from "@/types";

const SkeletonCard = () => (
  <Card className="animate-pulse overflow-hidden p-0">
    <div className="h-44 bg-fcn-primary/10" />
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

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get("search") ?? "",
    specialty: searchParams.get("specialty") ?? "",
    hospital_id: searchParams.get("hospital_id") ?? "",
    available_now: searchParams.get("available_now") === "true"
  });

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
    if (newFilters.available_now) params.set("available_now", "true");
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const queryParams = useMemo(() => ({
    search: filters.search || undefined,
    specialty: filters.specialty || undefined,
    hospital_id: filters.hospital_id || undefined,
    available_now: filters.available_now || undefined,
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

  const selectedDoctor = useMemo<DoctorFullProfile | null>(() => {
    if (!doctorDetailData?.data) return null;
    return doctorDetailData.data;
  }, [doctorDetailData]);

  const handleCloseDetail = useCallback(() => {
    setSelectedDoctorId(null);
  }, []);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              Find Doctors
            </h1>
            <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              Browse verified healthcare professionals
            </p>
          </div>
        </div>

        <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/80 dark:bg-fcn-dark/80 backdrop-blur-md border-b border-fcn-primary/5">
          <DoctorFilters filters={filters} onChange={updateFilters} />
        </div>

        {meta && (
          <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            Showing {doctors.length} doctor{doctors.length !== 1 ? "s" : ""}
            {meta.total > 0 && ` (${meta.total} total)`}
          </p>
        )}

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
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
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-fcn-primary/5">
                <Frown className="h-10 w-10 text-fcn-primary/30" />
              </div>
              <h3 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                No doctors found
              </h3>
              <p className="mt-1 text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50 text-center max-w-sm">
                Try adjusting your filters or search terms to find available doctors.
              </p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => {
                  setFilters({ search: "", specialty: "", hospital_id: "", available_now: false });
                  setSearchParams({}, { replace: true });
                }}
              >
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
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
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                type="button"
                onClick={() => setPage(i + 1)}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition ${
                  page === i + 1
                    ? "bg-fcn-accent text-white"
                    : "text-fcn-text-light/60 hover:bg-fcn-primary/5 dark:text-fcn-text-dark/60"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              icon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <DoctorDetailModal
        doctor={selectedDoctor}
        isOpen={!!selectedDoctorId}
        onClose={handleCloseDetail}
      />
    </PageTransition>
  );
};

export default FindDoctorsPage;

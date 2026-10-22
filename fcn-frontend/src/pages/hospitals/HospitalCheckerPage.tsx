import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  LayoutGrid,
  MapIcon,
  SlidersHorizontal,
  Activity,
  Bed,
  Clock,
  Sparkles,
  ArrowUpDown
} from "lucide-react";
import { clsx } from "clsx";
import { hospitalsService } from "@/services/hospitals.service";
import { useAuthStore } from "@/store/auth.store";
import { HospitalMap } from "@/components/hospitals/HospitalMap";
import { HospitalCard } from "@/components/hospitals/HospitalCard";
import { HospitalDetailModal } from "@/components/hospitals/HospitalDetailModal";
import { OccupancyUpdateForm } from "@/components/hospitals/OccupancyUpdateForm";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ImagePlaceholder } from "@/components/landing/ImagePlaceholder";
import type { Hospital, HospitalDetail } from "@/types";

type ViewMode = "map" | "list";
type SortMode = "least_busy" | "most_doctors" | "closest";

const HospitalCheckerPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortMode, setSortMode] = useState<SortMode>("least_busy");
  const [selectedHospital, setSelectedHospital] = useState<HospitalDetail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const user = useAuthStore((state) => state.user);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ["hospitals"],
    queryFn: () => hospitalsService.getAllHospitals()
  });

  const hospitals = useMemo(() => response?.data ?? [], [response]);
  const isHospitalAdmin = user?.role === "hospital_admin";
  const userHospital = useMemo(() => {
    if (!isHospitalAdmin || !hospitals.length) {
      return null;
    }
    return hospitals[0];
  }, [isHospitalAdmin, hospitals]);

  const sortedHospitals = useMemo(() => {
    const list = [...hospitals];
    switch (sortMode) {
      case "least_busy":
        list.sort((a, b) => a.occupancy_percent - b.occupancy_percent);
        break;
      case "most_doctors":
        list.sort((a, b) => b.active_doctors_count - a.active_doctors_count);
        break;
      default:
        break;
    }
    return list;
  }, [hospitals, sortMode]);

  const handleCardClick = useCallback(async (hospital: Hospital) => {
    try {
      const detailResponse = await hospitalsService.getHospitalById(hospital.id);
      if (detailResponse.success && detailResponse.data) {
        setSelectedHospital(detailResponse.data);
        setModalOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleMapSelect = useCallback((hospital: Hospital) => {
    handleCardClick(hospital);
  }, [handleCardClick]);

  const handleOccupancySuccess = useCallback(() => {
    setShowAdminForm(false);
  }, []);

  // Compute live overview stats
  const totalHospitals = hospitals.length;
  const avgOccupancy = totalHospitals > 0
    ? Math.round(hospitals.reduce((acc, h) => acc + h.occupancy_percent, 0) / totalHospitals)
    : 0;
  const activeDoctors = hospitals.reduce((acc, h) => acc + (h.active_doctors_count || 0), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              Hospital Capacity
            </h1>
            <p className="text-xs sm:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
              Check real-time ICU beds, occupancy rates, and doctors on duty
            </p>
          </div>
        </div>

        {/* Live Summary Chips */}
        {totalHospitals > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="rounded-xl border border-fcn-primary/10 bg-white dark:bg-fcn-dark px-3 py-1.5 shadow-sm">
              <span className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">Avg Occupancy: </span>
              <span className={clsx("font-bold", avgOccupancy > 80 ? "text-rose-500" : "text-emerald-500")}>
                {avgOccupancy}%
              </span>
            </div>
            <div className="rounded-xl border border-fcn-primary/10 bg-white dark:bg-fcn-dark px-3 py-1.5 shadow-sm">
              <span className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">On Duty: </span>
              <span className="font-bold text-fcn-primary">{activeDoctors} Doctors</span>
            </div>
          </div>
        )}
      </div>

      {isHospitalAdmin && userHospital && (
        <Card className="border-fcn-accent/30 bg-fcn-accent/5 p-4 sm:p-5 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fcn-accent/15 text-fcn-accent">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  Managing: <strong>{userHospital.name}</strong>
                </p>
                <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                  Keep hospital occupancy and active doctor counts accurate for emergency ambulances.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setShowAdminForm((p) => !p)}
            >
              {showAdminForm ? "Hide Form" : "Update Occupancy"}
            </Button>
          </div>
          {showAdminForm && (
            <div className="mt-4 pt-4 border-t border-fcn-accent/20">
              <OccupancyUpdateForm
                hospitalId={userHospital.id}
                currentData={userHospital}
                onSuccess={handleOccupancySuccess}
              />
            </div>
          )}
        </Card>
      )}

      {/* View Mode & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-fcn-primary/15 bg-white p-1 dark:bg-fcn-dark shadow-sm">
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all",
              viewMode === "list"
                ? "bg-fcn-primary text-white shadow-sm"
                : "text-fcn-text-light/60 hover:text-fcn-text-light dark:text-fcn-text-dark/60"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            List View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-all",
              viewMode === "map"
                ? "bg-fcn-primary text-white shadow-sm"
                : "text-fcn-text-light/60 hover:text-fcn-text-light dark:text-fcn-text-dark/60"
            )}
          >
            <MapIcon className="h-4 w-4" />
            Interactive Map
          </button>
        </div>

        {viewMode === "list" && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-fcn-text-light/50 dark:text-fcn-text-dark/50 hidden sm:inline">
              Sort by:
            </span>
            <div className="relative">
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="appearance-none rounded-xl border border-fcn-primary/20 bg-white py-2 pl-3 pr-8 text-xs sm:text-sm font-semibold text-fcn-text-light outline-none transition-all focus:border-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark cursor-pointer shadow-sm"
              >
                <option value="least_busy">🟢 Least Busy First</option>
                <option value="most_doctors">🩺 Most Doctors On Duty</option>
                <option value="closest" disabled>📍 Closest (GPS)</option>
              </select>
              <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-fcn-text-light/40" />
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "map" ? (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-2xl border border-fcn-primary/15 shadow-sm">
              <HospitalMap
                hospitals={sortedHospitals}
                onSelect={handleMapSelect}
                height={460}
              />
            </div>
            {sortedHospitals.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  Tap hospital card to inspect details
                </p>
                <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                  {sortedHospitals.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => handleCardClick(h)}
                      className="shrink-0 text-left active:scale-95 transition-transform"
                    >
                      <Card className="w-52 p-3.5 rounded-2xl" hoverable>
                        <p className="truncate text-sm font-bold text-fcn-text-light dark:text-fcn-text-dark">
                          {h.name}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-fcn-text-light/50">
                            {h.occupancy_percent}% occupied
                          </span>
                          <span className={clsx(
                            "h-2 w-2 rounded-full",
                            h.occupancy_percent > 80 ? "bg-rose-500" : h.occupancy_percent > 50 ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                        </div>
                      </Card>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} lines={5} />
                ))}
              </div>
            ) : error ? (
              <Card className="p-12 text-center max-w-md mx-auto space-y-3 rounded-2xl">
                <p className="text-sm font-semibold text-rose-500">Failed to load hospitals capacity data</p>
                <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                  Retry Connection
                </Button>
              </Card>
            ) : sortedHospitals.length === 0 ? (
              <Card className="p-12 text-center max-w-md mx-auto space-y-3 rounded-2xl">
                <Building2 className="mx-auto h-12 w-12 text-fcn-primary/30" />
                <h3 className="text-base font-bold text-fcn-text-light dark:text-fcn-text-dark">
                  No active hospitals found
                </h3>
                <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  There are currently no hospitals reporting live bed status.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedHospitals.map((h, i) => (
                  <HospitalCard
                    key={h.id}
                    hospital={h}
                    index={i}
                    onClick={() => handleCardClick(h)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selectedHospital && (
        <HospitalDetailModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedHospital(null); }}
          hospital={selectedHospital}
        />
      )}
    </div>
  );
};

export default HospitalCheckerPage;

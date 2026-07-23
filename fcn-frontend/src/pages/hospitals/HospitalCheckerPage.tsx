import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, LayoutGrid, MapIcon, SlidersHorizontal } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
          Hospital Checker
        </h1>
        <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          Check real-time capacity before you visit
        </p>
      </div>

      {isHospitalAdmin && userHospital && (
        <Card className="border-fcn-accent/30 bg-fcn-accent/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-fcn-accent" />
              <div>
                <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                  You manage <strong>{userHospital.name}</strong>'s data
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAdminForm((p) => !p)}
            >
              {showAdminForm ? "Hide Form" : "Update My Hospital"}
            </Button>
          </div>
          {showAdminForm && (
            <div className="mt-4">
              <OccupancyUpdateForm
                hospitalId={userHospital.id}
                currentData={userHospital}
                onSuccess={handleOccupancySuccess}
              />
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="flex rounded-lg border border-fcn-primary/20 bg-white p-0.5 dark:bg-fcn-dark">
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "list"
                ? "bg-fcn-primary text-white"
                : "text-fcn-text-light/60 hover:text-fcn-text-light dark:text-fcn-text-dark/60"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            List View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={clsx(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              viewMode === "map"
                ? "bg-fcn-primary text-white"
                : "text-fcn-text-light/60 hover:text-fcn-text-light dark:text-fcn-text-dark/60"
            )}
          >
            <MapIcon className="h-4 w-4" />
            Map View
          </button>
        </div>

        {viewMode === "list" && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-fcn-text-light/40" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-md border border-fcn-primary/20 bg-white px-2 py-1.5 text-sm text-fcn-text-light outline-none dark:bg-fcn-dark dark:text-fcn-text-dark"
            >
              <option value="least_busy">Least Busy</option>
              <option value="most_doctors">Most Doctors</option>
              <option value="closest" disabled>Closest — Coming soon</option>
            </select>
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
          >
            <HospitalMap
              hospitals={sortedHospitals}
              onSelect={handleMapSelect}
              height={400}
            />
            {sortedHospitals.length > 0 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {sortedHospitals.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => handleCardClick(h)}
                    className="shrink-0"
                  >
                    <Card className="w-48 p-3 text-left" hoverable>
                      <p className="truncate text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                        {h.name}
                      </p>
                      <p className="text-xs text-fcn-text-light/50">
                        {h.occupancy_percent}% occupied
                      </p>
                    </Card>
                  </button>
                ))}
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
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} lines={6} />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-20">
                <p className="text-fcn-danger">Failed to load hospitals</p>
              </div>
            ) : sortedHospitals.length === 0 ? (
              <div className="flex flex-col items-center py-16">
                <ImagePlaceholder
                  query="No active hospitals in your area"
                  alt="No hospitals"
                  className="mb-4 max-w-xs"
                />
                <p className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  No active hospitals found in your area
                </p>
              </div>
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

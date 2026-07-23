import { useMemo, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Building2 } from "lucide-react";
import { clsx } from "clsx";
import { doctorsService } from "@/services/doctors.service";
import { hospitalsService } from "@/services/hospitals.service";
import { useDebounce } from "@/hooks/useDebounce";

export interface FilterState {
  search: string;
  specialty: string;
  hospital_id: string;
  available_now: boolean;
}

interface DoctorFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const SpecialtyPill = ({
  label,
  selected,
  onClick
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200",
      selected
        ? "bg-fcn-accent text-white shadow-sm"
        : "border border-fcn-primary/15 text-fcn-text-light/60 dark:text-fcn-text-dark/60 hover:border-fcn-accent/40 hover:text-fcn-accent"
    )}
  >
    {label}
  </button>
);

const SkeletonPill = () => (
  <div className="h-8 w-20 animate-pulse rounded-full bg-fcn-primary/10" />
);

export const DoctorFilters = ({ filters, onChange }: DoctorFiltersProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    onChange({ ...filters, search: debouncedSearch });
  }, [debouncedSearch]);

  const { data: specialtiesData, isLoading: specialtiesLoading } = useQuery({
    queryKey: ["available-specialties"],
    queryFn: () => doctorsService.getAvailableSpecialties()
  });

  const { data: hospitalsData } = useQuery({
    queryKey: ["hospitals", "all"],
    queryFn: () => hospitalsService.getAllHospitals("active")
  });

  const specialties = useMemo(() => specialtiesData ?? [], [specialtiesData]);
  const hospitals = useMemo(() => hospitalsData?.data ?? [], [hospitalsData]);

  const update = (patch: Partial<FilterState>) => {
    onChange({ ...filters, ...patch });
  };

  const clearSearch = () => {
    setSearchInput("");
    onChange({ ...filters, search: "" });
  };

  const activeCount = [
    filters.available_now ? "Available Now" : null,
    filters.specialty,
    filters.hospital_id ? hospitals.find((h) => h.id === filters.hospital_id)?.name : null
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-primary/50" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search doctors by name or specialty..."
          className="h-10 w-full rounded-lg border border-fcn-primary/15 bg-white pl-10 pr-9 text-sm text-fcn-text-light outline-none transition focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/20 dark:bg-fcn-dark dark:text-fcn-text-dark"
        />
        {searchInput && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fcn-text-light/40 hover:text-fcn-text-light/70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <SpecialtyPill
          label="All Doctors"
          selected={!filters.available_now}
          onClick={() => update({ available_now: false })}
        />
        <SpecialtyPill
          label="Available Now"
          selected={filters.available_now}
          onClick={() => update({ available_now: true })}
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {specialtiesLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonPill key={i} />)
        ) : (
          <>
            <SpecialtyPill
              label="All Specialties"
              selected={!filters.specialty}
              onClick={() => update({ specialty: "" })}
            />
            {specialties.map((spec) => (
              <SpecialtyPill
                key={spec}
                label={spec}
                selected={filters.specialty === spec}
                onClick={() => update({ specialty: filters.specialty === spec ? "" : spec })}
              />
            ))}
          </>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-primary/50 pointer-events-none" />
          <select
            value={filters.hospital_id}
            onChange={(e) => update({ hospital_id: e.target.value, specialty: "" })}
            className="h-10 appearance-none rounded-lg border border-fcn-primary/15 bg-white pl-10 pr-8 text-sm text-fcn-text-light outline-none transition focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/20 dark:bg-fcn-dark dark:text-fcn-text-dark"
          >
            <option value="">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {activeCount > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.available_now && (
            <span className="inline-flex items-center gap-1 rounded-full bg-fcn-accent/10 px-2.5 py-1 text-xs font-medium text-fcn-accent">
              Available Now
              <button onClick={() => update({ available_now: false })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.specialty && (
            <span className="inline-flex items-center gap-1 rounded-full bg-fcn-accent/10 px-2.5 py-1 text-xs font-medium text-fcn-accent">
              {filters.specialty}
              <button onClick={() => update({ specialty: "" })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.hospital_id && (
            <span className="inline-flex items-center gap-1 rounded-full bg-fcn-accent/10 px-2.5 py-1 text-xs font-medium text-fcn-accent">
              {hospitals.find((h) => h.id === filters.hospital_id)?.name}
              <button onClick={() => update({ hospital_id: "" })}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

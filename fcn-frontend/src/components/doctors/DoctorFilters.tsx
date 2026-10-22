import { useMemo, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Building2, MapPin, Languages as LanguagesIcon, BadgeCheck, Filter, Layers, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { doctorsService } from "@/services/doctors.service";
import { hospitalsService } from "@/services/hospitals.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "@/i18n";
import { languageLabels } from "@/constants/languages";
import { SpecialtyFilterModal } from "./SpecialtyFilterModal";
import type { SupportedLanguage } from "@/types";

export interface FilterState {
  search: string;
  specialty: string;
  hospital_id: string;
  city: string;
  language: string;
  min_fee: string;
  max_fee: string;
  available_today: boolean;
  verified_only: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  search: "",
  specialty: "",
  hospital_id: "",
  city: "",
  language: "",
  min_fee: "",
  max_fee: "",
  available_today: false,
  verified_only: false,
};

interface DoctorFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const SpecialtyPill = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "relative whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all duration-150 select-none",
      "hover:scale-[1.02] active:scale-[0.98]",
      selected
        ? "bg-teal-500 text-white shadow-[0_4px_12px_rgba(20,184,166,0.35)]"
        : "border border-slate-200 dark:border-white/10 bg-slate-100/70 text-slate-600 dark:bg-white/5 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20"
    )}
  >
    {label}
  </button>
);

const SkeletonPill = () => (
  <div className="h-8 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
);

const selectClass =
  "h-11 appearance-none rounded-2xl border border-slate-200 bg-white pl-10 pr-9 text-xs font-semibold text-slate-700 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";

const SelectWrapper = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
      {icon}
    </span>
    {children}
  </div>
);

export const DoctorFilters = ({ filters, onChange }: DoctorFiltersProps) => {
  const shouldReduceMotion = useReducedMotion();
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search);
  const [specialtyModalOpen, setSpecialtyModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    onChange({ ...EMPTY_FILTERS, ...filters, search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data: specialtiesData, isLoading: specialtiesLoading } = useQuery({
    queryKey: ["available-specialties"],
    queryFn: () => doctorsService.getAvailableSpecialties(),
  });

  const { data: citiesData } = useQuery({
    queryKey: ["available-cities"],
    queryFn: () => doctorsService.getAvailableCities(),
  });

  const { data: hospitalsData } = useQuery({
    queryKey: ["hospitals", "active"],
    queryFn: () => hospitalsService.getAllHospitals("active"),
  });

  const specialties: string[] = specialtiesData ?? [];
  const cities: string[] = citiesData ?? [];
  const hospitals = hospitalsData?.data ?? [];

  const update = (partial: Partial<FilterState>) => {
    onChange({ ...filters, ...partial });
  };

  const clearSearch = () => {
    setSearchInput("");
    update({ search: "" });
  };

  const activeChips = [
    ...(filters.specialty
      ? [{ key: "specialty", label: filters.specialty, clear: () => update({ specialty: "" }) }]
      : []),
    ...(filters.hospital_id
      ? [
          {
            key: "hospital",
            label: hospitals.find((h) => h.id === filters.hospital_id)?.name ?? filters.hospital_id,
            clear: () => update({ hospital_id: "" }),
          },
        ]
      : []),
    ...(filters.city
      ? [{ key: "city", label: filters.city, clear: () => update({ city: "" }) }]
      : []),
    ...(filters.language
      ? [{ key: "language", label: filters.language, clear: () => update({ language: "" }) }]
      : []),
    ...(filters.available_today
      ? [{ key: "available_today", label: t("filter.availableToday"), clear: () => update({ available_today: false }) }]
      : []),
    ...(filters.verified_only
      ? [{ key: "verified_only", label: t("filter.verifiedOnly"), clear: () => update({ verified_only: false }) }]
      : []),
  ];

  return (
    <div className="space-y-3.5">
      {/* Search Bar (48px Touch Target) */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("filter.searchPlaceholder")}
          className="h-12 w-full rounded-2xl border border-slate-200/80 bg-white/90 pl-11 pr-10 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-white/10 dark:bg-slate-900 dark:text-white"
        />
        {searchInput && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Primary Toggle Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <SpecialtyPill
          label={t("filter.allDoctors")}
          selected={!filters.available_today}
          onClick={() => update({ available_today: false })}
        />
        <SpecialtyPill
          label={t("filter.availableToday")}
          selected={filters.available_today}
          onClick={() => update({ available_today: true })}
        />
        <button
          type="button"
          onClick={() => update({ verified_only: !filters.verified_only })}
          className={clsx(
            "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all duration-150 select-none",
            filters.verified_only
              ? "bg-teal-500 text-white shadow-[0_4px_12px_rgba(20,184,166,0.35)]"
              : "border border-slate-200 dark:border-white/10 bg-slate-100/70 text-slate-600 dark:bg-white/5 dark:text-slate-300 hover:border-slate-300"
          )}
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          <span>{t("filter.verifiedOnly")}</span>
        </button>

        {/* Visual Categorized Modal Trigger */}
        <button
          type="button"
          onClick={() => setSpecialtyModalOpen(true)}
          className={clsx(
            "flex items-center gap-2 shrink-0 rounded-full px-4 py-2 text-xs font-black transition-all select-none border",
            filters.specialty
              ? "bg-teal-500 text-white border-teal-500 shadow-[0_4px_12px_rgba(20,184,166,0.35)]"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 hover:border-teal-500/50 shadow-xs"
          )}
          title="Browse grouped specialties with category icons"
        >
          <Layers className="h-3.5 w-3.5 text-teal-500" />
          <span>{filters.specialty ? filters.specialty : "All Specialties (Grouped)"}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </div>

      {/* Visual Specialty Categories Modal */}
      <SpecialtyFilterModal
        isOpen={specialtyModalOpen}
        onClose={() => setSpecialtyModalOpen(false)}
        selectedSpecialty={filters.specialty}
        onSelectSpecialty={(spec) => update({ specialty: spec })}
        availableSpecialties={specialties}
      />

      {/* Dropdown Filters row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <SelectWrapper icon={<Building2 className="h-4 w-4" />}>
          <select
            value={filters.hospital_id}
            onChange={(e) => update({ hospital_id: e.target.value, specialty: "" })}
            className={selectClass}
            aria-label="Filter by Hospital"
          >
            <option value="">{t("filter.allHospitals")}</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </SelectWrapper>

        <SelectWrapper icon={<MapPin className="h-4 w-4" />}>
          <select
            value={filters.city}
            onChange={(e) => update({ city: e.target.value })}
            className={selectClass}
            aria-label="Filter by City"
          >
            <option value="">{t("filter.allCities")}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </SelectWrapper>
      </div>

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Active:</span>
          </span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-300 border border-teal-500/20"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={chip.clear}
                className="hover:text-rose-500 transition-colors"
                aria-label={`Remove filter ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors underline ml-1"
          >
            {t("doctors.clearFilters")}
          </button>
        </div>
      )}
    </div>
  );
};

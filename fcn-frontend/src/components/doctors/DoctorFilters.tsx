import { useMemo, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Building2, MapPin, Languages as LanguagesIcon, BadgeCheck } from "lucide-react";
import { clsx } from "clsx";
import { doctorsService } from "@/services/doctors.service";
import { hospitalsService } from "@/services/hospitals.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "@/i18n";
import { languageLabels } from "@/constants/languages";
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
  verified_only: false
};

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

const selectClass =
  "h-10 appearance-none rounded-lg border border-fcn-primary/15 bg-white pl-10 pr-8 text-sm text-fcn-text-light outline-none transition focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/20 dark:bg-fcn-dark dark:text-fcn-text-dark";

const SelectWrapper = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fcn-primary/50">
      {icon}
    </span>
    {children}
  </div>
);

export const DoctorFilters = ({ filters, onChange }: DoctorFiltersProps) => {
  const shouldReduceMotion = useReducedMotion();
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    onChange({ ...EMPTY_FILTERS, ...filters, search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const { data: specialtiesData, isLoading: specialtiesLoading } = useQuery({
    queryKey: ["available-specialties"],
    queryFn: () => doctorsService.getAvailableSpecialties()
  });

  const { data: citiesData } = useQuery({
    queryKey: ["available-cities"],
    queryFn: () => doctorsService.getAvailableCities()
  });

  const { data: hospitalsData } = useQuery({
    queryKey: ["hospitals", "all"],
    queryFn: () => hospitalsService.getAllHospitals("active")
  });

  const specialties = useMemo(() => specialtiesData ?? [], [specialtiesData]);
  const cities = useMemo(() => citiesData ?? [], [citiesData]);
  const hospitals = useMemo(() => hospitalsData?.data ?? [], [hospitalsData]);
  const languages = useMemo(
    () => (["en", "am", "so", "om"] as SupportedLanguage[]).map((code) => languageLabels[code].name),
    []
  );

  const update = (patch: Partial<FilterState>) => {
    onChange({ ...filters, ...patch });
  };

  const clearSearch = () => {
    setSearchInput("");
    onChange({ ...filters, search: "" });
  };

  const activeChips: Array<{ key: string; label: string; clear: () => void }> = [
    {
      key: "available_today",
      label: t("filter.availableToday"),
      clear: () => update({ available_today: false })
    },
    {
      key: "verified_only",
      label: t("filter.verifiedOnly"),
      clear: () => update({ verified_only: false })
    },
    ...(filters.specialty
      ? [{ key: "specialty", label: filters.specialty, clear: () => update({ specialty: "" }) }]
      : []),
    ...(filters.city
      ? [{ key: "city", label: filters.city, clear: () => update({ city: "" }) }]
      : []),
    ...(filters.language
      ? [{ key: "language", label: filters.language, clear: () => update({ language: "" }) }]
      : []),
    ...(filters.hospital_id
      ? [{
          key: "hospital_id",
          label: hospitals.find((h) => h.id === filters.hospital_id)?.name ?? "",
          clear: () => update({ hospital_id: "" })
        }]
      : [])
  ].filter((chip) => Boolean(chip.label));

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-primary/50" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("filter.searchPlaceholder")}
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
            "flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-200",
            filters.verified_only
              ? "bg-fcn-accent text-white shadow-sm"
              : "border border-fcn-primary/15 text-fcn-text-light/60 dark:text-fcn-text-dark/60 hover:border-fcn-accent/40 hover:text-fcn-accent"
          )}
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          {t("filter.verifiedOnly")}
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {specialtiesLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonPill key={i} />)
        ) : (
          <>
            <SpecialtyPill
              label={t("filter.allSpecialties")}
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

      <div className="flex flex-wrap items-center gap-2">
        <SelectWrapper icon={<Building2 className="h-4 w-4" />}>
          <select
            value={filters.hospital_id}
            onChange={(e) => update({ hospital_id: e.target.value, specialty: "" })}
            className={selectClass}
          >
            <option value="">{t("filter.allHospitals")}</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </SelectWrapper>

        <SelectWrapper icon={<MapPin className="h-4 w-4" />}>
          <select
            value={filters.city}
            onChange={(e) => update({ city: e.target.value })}
            className={selectClass}
          >
            <option value="">{t("filter.allCities")}</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </SelectWrapper>

        <SelectWrapper icon={<LanguagesIcon className="h-4 w-4" />}>
          <select
            value={filters.language}
            onChange={(e) => update({ language: e.target.value })}
            className={selectClass}
          >
            <option value="">{t("filter.allLanguages")}</option>
            {languages.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </SelectWrapper>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            {t("filter.priceHint")}
          </span>
          <input
            type="number"
            min={0}
            value={filters.min_fee}
            onChange={(e) => update({ min_fee: e.target.value })}
            placeholder={`${t("common.min")} ${t("filter.etb")}`}
            className="h-10 w-24 rounded-lg border border-fcn-primary/15 bg-white px-3 text-sm text-fcn-text-light outline-none transition focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/20 dark:bg-fcn-dark dark:text-fcn-text-dark"
            aria-label={t("common.min")}
          />
          <input
            type="number"
            min={0}
            value={filters.max_fee}
            onChange={(e) => update({ max_fee: e.target.value })}
            placeholder={`${t("common.max")} ${t("filter.etb")}`}
            className="h-10 w-24 rounded-lg border border-fcn-primary/15 bg-white px-3 text-sm text-fcn-text-light outline-none transition focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/20 dark:bg-fcn-dark dark:text-fcn-text-dark"
            aria-label={t("common.max")}
          />
        </div>
      </div>

      {activeChips.length > 1 && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-1.5"
        >
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full bg-fcn-accent/10 px-2.5 py-1 text-xs font-medium text-fcn-accent"
            >
              {chip.label}
              <button onClick={chip.clear} aria-label={t("common.close")}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </motion.div>
      )}
    </div>
  );
};
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Check,
  Stethoscope,
  Baby,
  HeartPulse,
  Activity,
  Brain,
  Layers,
  Sparkles
} from "lucide-react";
import { clsx } from "clsx";
import {
  SPECIALTY_CATEGORIES,
  getGroupedSpecialties,
  type SpecialtyCategory
} from "@/constants/specialties";

interface SpecialtyFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSpecialty: string;
  onSelectSpecialty: (specialty: string) => void;
  availableSpecialties: string[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Stethoscope: <Stethoscope className="h-5 w-5" />,
  Baby: <Baby className="h-5 w-5" />,
  HeartPulse: <HeartPulse className="h-5 w-5" />,
  Activity: <Activity className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />
};

export const SpecialtyFilterModal = ({
  isOpen,
  onClose,
  selectedSpecialty,
  onSelectSpecialty,
  availableSpecialties
}: SpecialtyFilterModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const { categorized, uncategorized } = useMemo(() => {
    return getGroupedSpecialties(availableSpecialties);
  }, [availableSpecialties]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return categorized;

    return categorized
      .map((catGroup) => {
        const matchesCategory =
          catGroup.category.name.toLowerCase().includes(term) ||
          catGroup.category.description.toLowerCase().includes(term);

        const matchingItems = catGroup.items.filter((item) =>
          item.toLowerCase().includes(term)
        );

        if (matchesCategory) {
          return catGroup;
        }

        return {
          ...catGroup,
          items: matchingItems
        };
      })
      .filter((catGroup) => catGroup.items.length > 0);
  }, [categorized, searchTerm]);

  const filteredUncategorized = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return uncategorized;
    return uncategorized.filter((item) => item.toLowerCase().includes(term));
  }, [uncategorized, searchTerm]);

  if (!isOpen) return null;

  const handleSelect = (spec: string) => {
    onSelectSpecialty(spec);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm">
        {/* Backdrop click dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-[28px] sm:rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-5 sm:px-6 py-4 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Filter by Medical Specialty
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Select a specialist category or specific practice
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200 transition-colors"
              aria-label="Close specialty filter"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search & Quick Clear bar */}
          <div className="p-4 sm:px-6 border-b border-slate-200/80 dark:border-white/10 space-y-3 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search specialty e.g. Cardiology, Pediatrics, Surgery..."
                className="h-10 w-full rounded-xl border border-slate-200/80 bg-slate-50/80 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-white/10 dark:bg-slate-800/80 dark:text-white"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* All Specialties Reset button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSelect("")}
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all select-none",
                  !selectedSpecialty
                    ? "bg-teal-500 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                )}
              >
                {!selectedSpecialty && <Check className="h-3.5 w-3.5" />}
                <span>All Specialties (Show Everyone)</span>
              </button>

              {selectedSpecialty && (
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className="text-xs font-semibold text-rose-500 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Grouped Categories Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {filteredCategories.map(({ category, items }) => {
              const icon = CATEGORY_ICONS[category.iconName] || <Stethoscope className="h-5 w-5" />;
              const hasSelected = items.includes(selectedSpecialty);

              return (
                <div
                  key={category.id}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.02] p-4 sm:p-5 transition-all"
                >
                  {/* Category Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={clsx(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-xs",
                        category.color.bg,
                        category.color.text,
                        category.color.border
                      )}
                    >
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {category.name}
                        </h3>
                        {hasSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500 text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                        {category.description}
                      </p>
                    </div>
                  </div>

                  {/* Specialist Types Chips */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {items.map((spec) => {
                      const isSelected = selectedSpecialty === spec;
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => handleSelect(spec)}
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all select-none text-left",
                            "hover:scale-[1.02] active:scale-[0.98]",
                            isSelected
                              ? "bg-teal-500 text-white shadow-md shadow-teal-500/25"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 hover:border-teal-500/50 hover:bg-teal-500/5"
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                          <span>{spec}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Uncategorized / Extra Available Specialties */}
            {filteredUncategorized.length > 0 && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.02] p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-teal-500" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Additional Specialties
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredUncategorized.map((spec) => {
                    const isSelected = selectedSpecialty === spec;
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => handleSelect(spec)}
                        className={clsx(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all select-none text-left",
                          isSelected
                            ? "bg-teal-500 text-white shadow-md"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 hover:border-teal-500/50"
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                        <span>{spec}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredCategories.length === 0 && filteredUncategorized.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm font-semibold">No specialties match "{searchTerm}"</p>
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200/80 dark:border-white/10 px-5 sm:px-6 py-3.5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              {selectedSpecialty ? (
                <>
                  Selected: <strong className="text-teal-600 dark:text-teal-400">{selectedSpecialty}</strong>
                </>
              ) : (
                "Showing all specialties"
              )}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

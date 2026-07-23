import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, ChevronRight, Search,
  Calendar, Flag, AlertTriangle, Filter
} from "lucide-react";
import { clsx } from "clsx";
import { SpO2Alert } from "@/components/health-records/SpO2Alert";

interface VitalsRecord {
  id: string;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  blood_glucose_mg_dl: number | null;
  heart_rate_bpm: number | null;
  temperature_celsius: number | null;
  spo2_percent: number | null;
  weight_kg: number | null;
  bmi: number | null;
  vital_source: string;
  is_flagged: boolean;
  flagged_reasons: string[];
  recorded_at: string;
  recorded_by_user?: { full_name: string; role: string } | null;
}

interface VitalsHistoryTableProps {
  records: VitalsRecord[];
  isLoading: boolean;
  pageSize?: number;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: string) {
  const dt = new Date(d);
  return `${months[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
}

function fmtTime(d: string) {
  const dt = new Date(d);
  const h = dt.getHours();
  const m = dt.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${ampm}`;
}

export const VitalsHistoryTable = ({
  records,
  isLoading,
  pageSize = 10
}: VitalsHistoryTableProps) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let data = [...records];

    if (flaggedOnly) {
      data = data.filter((r) => r.is_flagged);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => {
        const vals = [
          r.bp_systolic, r.bp_diastolic, r.blood_glucose_mg_dl,
          r.heart_rate_bpm, r.temperature_celsius, r.spo2_percent,
          r.weight_kg, r.bmi
        ];
        return vals.some((v) => v != null && String(v).includes(q));
      });
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      data = data.filter((r) => new Date(r.recorded_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      data = data.filter((r) => new Date(r.recorded_at) <= to);
    }

    return data.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  }, [records, search, flaggedOnly, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 rounded-xl border border-fcn-primary/10 bg-white p-4 dark:bg-fcn-dark">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-fcn-primary/5" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-fcn-primary/10 bg-white p-8 text-center dark:bg-fcn-dark">
        <Calendar className="mx-auto mb-3 h-10 w-10 text-fcn-text-light/20 dark:text-fcn-text-dark/20" />
        <p className="text-sm font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          No vitals recorded yet
        </p>
        <p className="mt-1 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
          Use the form above to record your first set of vitals
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-fcn-primary/10 bg-white dark:bg-fcn-dark">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fcn-primary/10 px-4 py-3">
        <h4 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
          Vitals History ({filtered.length})
        </h4>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fcn-text-light/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search values..."
              className="h-8 w-36 rounded-md border border-fcn-primary/15 bg-white pl-8 pr-2 text-xs text-fcn-text-light outline-none placeholder:text-fcn-text-light/40 focus:border-fcn-accent dark:bg-fcn-dark dark:text-fcn-text-dark"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              "flex h-8 w-8 items-center justify-center rounded-md border transition",
              showFilters
                ? "border-fcn-accent bg-fcn-accent/10 text-fcn-accent"
                : "border-fcn-primary/15 text-fcn-text-light/50 hover:border-fcn-primary/30"
            )}
            aria-label="Toggle filters"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => { setFlaggedOnly(!flaggedOnly); setPage(1); }}
            className={clsx(
              "flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-medium transition",
              flaggedOnly
                ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950/20"
                : "border-fcn-primary/15 text-fcn-text-light/50 hover:border-fcn-primary/30"
            )}
          >
            <Flag className="h-3 w-3" />
            Flagged
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap items-center gap-3 overflow-hidden border-b border-fcn-primary/10 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-7 rounded border border-fcn-primary/15 px-2 text-xs text-fcn-text-light dark:bg-fcn-dark dark:text-fcn-text-dark"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-7 rounded border border-fcn-primary/15 px-2 text-xs text-fcn-text-light dark:bg-fcn-dark dark:text-fcn-text-dark"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-[10px] font-medium text-fcn-primary hover:underline"
              >
                Clear
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-fcn-primary/10 bg-fcn-light/50 dark:bg-fcn-dark/50">
                <TH className="sticky left-0 z-10 bg-fcn-light dark:bg-fcn-dark shadow-[2px_0_4px_rgba(0,0,0,0.05)]">Date</TH>
                <TH>Time</TH>
                <TH>BP</TH>
                <TH>Glucose</TH>
                <TH>HR</TH>
                <TH>Temp</TH>
                <TH>SpO2</TH>
                <TH>Weight</TH>
                <TH>BMI</TH>
                <TH>Source</TH>
                <TH />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                    No records match filters
                  </td>
                </tr>
              ) : (
                paged.map((rec) => (
                  <motion.tr
                    key={rec.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={clsx(
                      "border-b border-fcn-primary/5 transition-colors hover:bg-fcn-light/50 dark:hover:bg-fcn-dark/50",
                      rec.is_flagged && "bg-red-50/50 dark:bg-red-950/10"
                    )}
                  >
                    <TD className="sticky left-0 z-10 bg-white dark:bg-fcn-dark shadow-[2px_0_4px_rgba(0,0,0,0.05)]">{fmtDate(rec.recorded_at)}</TD>
                    <TD>{fmtTime(rec.recorded_at)}</TD>
                    <TD>
                      {rec.bp_systolic ? `${rec.bp_systolic}/${rec.bp_diastolic ?? "—"}` : "—"}
                    </TD>
                    <TD>{rec.blood_glucose_mg_dl ?? "—"}</TD>
                    <TD>{rec.heart_rate_bpm ?? "—"}</TD>
                    <TD>{rec.temperature_celsius ?? "—"}</TD>
                    <TD>
                      {rec.spo2_percent != null ? (
                        <span className="inline-flex items-center gap-1">
                          {rec.spo2_percent < 95 && <AlertTriangle className="h-3 w-3 text-red-500" />}
                          {rec.spo2_percent}
                        </span>
                      ) : "—"}
                    </TD>
                    <TD>{rec.weight_kg ?? "—"}</TD>
                    <TD>{rec.bmi ?? "—"}</TD>
                    <TD>
                      <span className={clsx(
                        "capitalize",
                        rec.vital_source === "self" && "text-fcn-accent",
                        rec.vital_source === "nurse" && "text-emerald-500",
                        rec.vital_source === "doctor" && "text-blue-500"
                      )}>
                        {rec.vital_source}
                      </span>
                    </TD>
                    <TD>
                      {rec.is_flagged && (
                        <span className="flex items-center gap-1 text-[10px] text-red-500" title={rec.flagged_reasons?.join(", ")}>
                          <Flag className="h-3 w-3" />
                        </span>
                      )}
                    </TD>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Scroll indicator */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent dark:from-fcn-dark/80" />
        <div className="pointer-events-none absolute bottom-2 right-2 text-[10px] text-fcn-text-light/30 animate-pulse">
          More →
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-fcn-primary/10 px-4 py-3">
          <span className="text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="flex h-7 w-7 items-center justify-center rounded text-fcn-text-light/60 hover:bg-fcn-primary/10 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition",
                    p === safePage
                      ? "bg-fcn-primary text-white"
                      : "text-fcn-text-light/60 hover:bg-fcn-primary/10"
                  )}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="flex h-7 w-7 items-center justify-center rounded text-fcn-text-light/60 hover:bg-fcn-primary/10 disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function TH({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={clsx("whitespace-nowrap px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-fcn-text-light/50 dark:text-fcn-text-dark/50", className)}>
      {children}
    </th>
  );
}

function TD({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={clsx("whitespace-nowrap px-3 py-2.5 text-fcn-text-light/70 dark:text-fcn-text-dark/70", className)}>{children}</td>;
}

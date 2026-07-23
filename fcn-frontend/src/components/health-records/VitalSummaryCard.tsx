import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { Share2 } from "lucide-react";
import type { VitalClassification } from "@/utils/vitals-classifier";

interface VitalSummaryCardProps {
  label: string;
  value: string;
  unit: string;
  classification: VitalClassification | null;
  icon: ReactNode;
  recordedAt: string | null;
  isLoading: boolean;
  shareData?: {
    vitalName: string;
    value: string;
    unit: string;
    status: string;
    timeAgo: string;
  } | null;
}

export const VitalSummaryCard = ({
  label,
  value,
  unit,
  classification,
  icon,
  recordedAt,
  isLoading,
  shareData
}: VitalSummaryCardProps) => {
  const valueRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (valueRef.current && prevValueRef.current !== value && prevValueRef.current !== "—") {
      valueRef.current.classList.add("animate-vital-pulse");
      const timer = setTimeout(() => valueRef.current?.classList.remove("animate-vital-pulse"), 500);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-fcn-primary/10 bg-white p-4 dark:bg-fcn-dark">
        <div className="mb-3 h-4 w-20 rounded bg-fcn-primary/10" />
        <div className="mb-2 h-8 w-24 rounded bg-fcn-primary/10" />
        <div className="h-4 w-16 rounded bg-fcn-primary/10" />
      </div>
    );
  }

  const borderColor = classification?.borderColor ?? "border-fcn-primary/20";
  const statusColor = classification?.color ?? "#94A3B8";
  const statusLabel = classification?.label ?? "Not recorded";

  const handleShare = () => {
    if (!shareData) return;
    const text = `My latest ${shareData.vitalName}: ${shareData.value} ${shareData.unit} — ${shareData.status}
Recorded ${shareData.timeAgo} on FCN`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch(() => {
      toast.error("Could not copy");
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        "relative overflow-hidden rounded-xl border-l-[3px] bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-fcn-dark",
        borderColor
      )}
    >
      <motion.div
        className="absolute bottom-0 left-0 w-[3px] bg-fcn-accent/30"
        initial={{ height: "0%" }}
        animate={{ height: "100%" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-fcn-accent">{icon}</span>
          <span className="text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            {label}
          </span>
        </div>
        {shareData && value && value !== "—" && (
          <button
            onClick={handleShare}
            className="flex h-6 w-6 items-center justify-center rounded-md text-fcn-text-light/30 hover:bg-fcn-primary/10 hover:text-fcn-primary transition-colors"
            title="Share with doctor"
          >
            <Share2 className="h-3 w-3" />
          </button>
        )}
      </div>

      <div ref={valueRef} className="mt-2 flex items-baseline gap-1.5 transition-colors duration-300">
        <span className="font-mono text-3xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
          {value || "—"}
        </span>
        {value && value !== "—" && (
          <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">{unit}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {value && value !== "—" ? (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor
            }}
          >
            {statusLabel}
          </span>
        ) : (
          <span className="text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
            Not recorded
          </span>
        )}
        {recordedAt && (
          <span className="text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
            {recordedAt}
          </span>
        )}
      </div>
    </motion.div>
  );
};

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { clsx } from "clsx";
import type { VitalStatus } from "@/types";

interface HealthMetricCardProps {
  label: string;
  value: number;
  unit: string;
  status: VitalStatus;
  icon: ReactNode;
  trend?: "up" | "down" | "stable";
  className?: string;
}

const statusConfig: Record<
  VitalStatus,
  {
    pill: string;
    pillBg: string;
    border: string;
    dot: string;
    label: string;
  }
> = {
  normal: {
    pill: "text-emerald-700 dark:text-emerald-300",
    pillBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
    label: "Normal",
  },
  warning: {
    pill: "text-amber-700 dark:text-amber-300",
    pillBg: "bg-amber-500/10 dark:bg-amber-500/20",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
    label: "Caution",
  },
  critical: {
    pill: "text-rose-700 dark:text-rose-300",
    pillBg: "bg-rose-500/10 dark:bg-rose-500/20",
    border: "border-rose-500/30",
    dot: "bg-rose-500 animate-ping",
    label: "Critical",
  },
};

const TrendIcon = ({ trend }: { trend: NonNullable<HealthMetricCardProps["trend"]> }) => {
  if (trend === "up") {
    return <ArrowUp className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />;
  }
  if (trend === "down") {
    return <ArrowDown className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />;
  }
  return <ArrowRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />;
};

/**
 * Mobile-First Health Metric Card
 * Implements Mobile Style Reference Pattern #5:
 * Big stat numbers in heavy weight type with small muted labels beneath.
 */
export const HealthMetricCard = ({
  label,
  value,
  unit,
  status,
  icon,
  trend = "stable",
  className,
}: HealthMetricCardProps) => {
  const valueRef = useRef<HTMLSpanElement>(null);
  const config = statusConfig[status];

  useEffect(() => {
    const target = valueRef.current;

    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (target) {
        target.textContent = String(value);
      }
      return;
    }

    const counter = { value: 0 };
    gsap.to(counter, {
      value,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        target.textContent = Math.round(counter.value).toString();
      },
    });
  }, [value]);

  return (
    <div
      className={clsx(
        "relative rounded-2xl border bg-white dark:bg-fcn-dark/95 p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md",
        config.border,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                ref={valueRef}
                className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight"
              >
                {value}
              </span>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                {unit}
              </span>
            </div>
          </div>
        </div>

        {/* Status Dot Pill */}
        <div
          className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight",
            config.pillBg,
            config.pill
          )}
        >
          <span className={clsx("w-1.5 h-1.5 rounded-full", config.dot)} />
          <span>{config.label}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-medium">Trend</span>
        <div className="flex items-center gap-1 capitalize font-semibold text-slate-700 dark:text-slate-300">
          <TrendIcon trend={trend} />
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
};

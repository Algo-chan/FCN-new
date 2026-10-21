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
    return <ArrowUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />;
  }
  if (trend === "down") {
    return <ArrowDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />;
  }
  return <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-slate-400 dark:text-slate-500 shrink-0" />;
};

/**
 * Mobile-First Health Metric Card
 * Implements Mobile Style Reference Pattern #5:
 * Big stat numbers in heavy weight type with small muted labels beneath.
 * Structured vertically so metric value and labels never overflow on 2-col mobile screens.
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
  const config = statusConfig[status] || statusConfig.normal;

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
        "relative rounded-2xl border bg-white dark:bg-fcn-dark/95 p-3 sm:p-4 lg:p-5 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden min-w-0",
        config.border,
        className
      )}
    >
      <div className="min-w-0">
        {/* Top Header Row: Icon (Left) & Status Pill (Right) */}
        <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0">
            {icon}
          </div>

          {/* Status Dot Pill */}
          <div
            className={clsx(
              "flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-tight shrink-0",
              config.pillBg,
              config.pill
            )}
          >
            <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
            <span>{config.label}</span>
          </div>
        </div>

        {/* Value + Unit (Big stat numbers - Mobile Pattern #5) */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span
              ref={valueRef}
              className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none"
            >
              {value}
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 leading-none truncate">
              {unit}
            </span>
          </div>
          <p
            className="mt-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 truncate leading-tight"
            title={label}
          >
            {label}
          </p>
        </div>
      </div>

      {/* Bottom Trend Row */}
      <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] sm:text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-medium">Trend</span>
        <div className="flex items-center gap-1 capitalize font-semibold text-slate-700 dark:text-slate-300">
          <TrendIcon trend={trend} />
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
};

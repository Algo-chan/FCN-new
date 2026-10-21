import { type ReactNode } from "react";
import { clsx } from "clsx";

export interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: "teal" | "sky" | "coral" | "amber" | "violet" | "emerald";
  label?: string;
  sublabel?: string;
  showValue?: boolean;
  formatValue?: (val: number) => string;
  icon?: ReactNode;
  className?: string;
}

const colorMap = {
  teal: {
    stroke: "stroke-teal-500",
    text: "text-teal-600 dark:text-teal-400",
    bg: "stroke-teal-100 dark:stroke-teal-950/50",
    glow: "shadow-[0_0_20px_rgba(20,184,166,0.3)]",
  },
  sky: {
    stroke: "stroke-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    bg: "stroke-sky-100 dark:stroke-sky-950/50",
    glow: "shadow-[0_0_20px_rgba(14,165,233,0.3)]",
  },
  coral: {
    stroke: "stroke-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    bg: "stroke-rose-100 dark:stroke-rose-950/50",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.3)]",
  },
  amber: {
    stroke: "stroke-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    bg: "stroke-amber-100 dark:stroke-amber-950/50",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
  },
  violet: {
    stroke: "stroke-purple-500",
    text: "text-purple-600 dark:text-purple-400",
    bg: "stroke-purple-100 dark:stroke-purple-950/50",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
  },
  emerald: {
    stroke: "stroke-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "stroke-emerald-100 dark:stroke-emerald-950/50",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
  },
};

/**
 * Mobile-First Circular Progress Ring
 * Implements Mobile Style Reference Pattern #4:
 * Circular progress rings for health scores, recovery status, vitals, and goals.
 */
export const CircularProgress = ({
  value,
  max = 100,
  size = 96,
  strokeWidth = 8,
  color = "teal",
  label,
  sublabel,
  showValue = true,
  formatValue,
  icon,
  className,
}: CircularProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const activeColor = colorMap[color] || colorMap.teal;

  const displayVal = formatValue ? formatValue(value) : `${Math.round(percentage)}%`;

  return (
    <div
      className={clsx("relative inline-flex flex-col items-center justify-center", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || "Progress indicator"}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg] overflow-visible"
        >
          {/* Track background */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            className={activeColor.bg}
          />
          {/* Progress fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={clsx(
              activeColor.stroke,
              "transition-all duration-700 ease-out"
            )}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          {icon && <div className="mb-0.5">{icon}</div>}
          {showValue && (
            <span className={clsx("text-lg font-black tracking-tight", activeColor.text)}>
              {displayVal}
            </span>
          )}
        </div>
      </div>

      {(label || sublabel) && (
        <div className="mt-2 text-center">
          {label && (
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              {label}
            </p>
          )}
          {sublabel && (
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
              {sublabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

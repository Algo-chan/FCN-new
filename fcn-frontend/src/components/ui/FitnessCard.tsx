import { type ReactNode } from "react";
import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";

export interface FitnessCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
  actionLabel?: string;
  onClick?: () => void;
  gradient?:
    | "teal"
    | "sky"
    | "coral"
    | "amber"
    | "violet"
    | "emerald"
    | "clinical"
    | "neutral";
  rightElement?: ReactNode;
  className?: string;
  disabled?: boolean;
}

const gradientStyles: Record<
  NonNullable<FitnessCardProps["gradient"]>,
  {
    bg: string;
    border: string;
    iconBg: string;
    iconColor: string;
    shadow: string;
    arrowBg: string;
  }
> = {
  teal: {
    bg: "bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-transparent",
    border: "border-teal-500/20 dark:border-teal-500/30",
    iconBg: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-[0_4px_16px_rgba(20,184,166,0.35)]",
    iconColor: "text-white",
    shadow: "hover:shadow-[0_12px_32px_rgba(13,148,136,0.18)] dark:hover:shadow-[0_12px_32px_rgba(20,184,166,0.1)]",
    arrowBg: "bg-teal-500/15 text-teal-700 dark:bg-teal-400/20 dark:text-teal-300",
  },
  sky: {
    bg: "bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent dark:from-sky-950/40 dark:via-blue-950/20 dark:to-transparent",
    border: "border-sky-500/20 dark:border-sky-500/30",
    iconBg: "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_4px_16px_rgba(14,165,233,0.35)]",
    iconColor: "text-white",
    shadow: "hover:shadow-[0_12px_32px_rgba(14,165,233,0.18)] dark:hover:shadow-[0_12px_32px_rgba(14,165,233,0.1)]",
    arrowBg: "bg-sky-500/15 text-sky-700 dark:bg-sky-400/20 dark:text-sky-300",
  },
  coral: {
    bg: "bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-transparent dark:from-rose-950/40 dark:via-orange-950/20 dark:to-transparent",
    border: "border-rose-500/20 dark:border-rose-500/30",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_4px_16px_rgba(244,63,94,0.35)]",
    iconColor: "text-white",
    shadow: "hover:shadow-[0_12px_32px_rgba(244,63,94,0.18)] dark:hover:shadow-[0_12px_32px_rgba(244,63,94,0.1)]",
    arrowBg: "bg-rose-500/15 text-rose-700 dark:bg-rose-400/20 dark:text-rose-300",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-transparent",
    border: "border-amber-500/20 dark:border-amber-500/30",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_4px_16px_rgba(245,158,11,0.35)]",
    iconColor: "text-white",
    shadow: "hover:shadow-[0_12px_32px_rgba(245,158,11,0.18)] dark:hover:shadow-[0_12px_32px_rgba(245,158,11,0.1)]",
    arrowBg: "bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300",
  },
  violet: {
    bg: "bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-transparent",
    border: "border-purple-500/20 dark:border-purple-500/30",
    iconBg: "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-[0_4px_16px_rgba(168,85,247,0.35)]",
    iconColor: "text-white",
    shadow: "hover:shadow-[0_12px_32px_rgba(168,85,247,0.18)] dark:hover:shadow-[0_12px_32px_rgba(168,85,247,0.1)]",
    arrowBg: "bg-purple-500/15 text-purple-700 dark:bg-purple-400/20 dark:text-purple-300",
  },
  emerald: {
    bg: "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-transparent",
    border: "border-emerald-500/20 dark:border-emerald-500/30",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)]",
    iconColor: "text-white",
    shadow: "hover:shadow-[0_12px_32px_rgba(16,185,129,0.18)] dark:hover:shadow-[0_12px_32px_rgba(16,185,129,0.1)]",
    arrowBg: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300",
  },
  clinical: {
    bg: "bg-gradient-to-br from-teal-500/10 via-sky-500/10 to-transparent dark:from-teal-950/50 dark:via-sky-950/30 dark:to-transparent",
    border: "border-teal-500/25 dark:border-teal-400/30",
    iconBg: "bg-gradient-to-br from-teal-600 to-sky-600 text-white shadow-[0_4px_18px_rgba(13,148,136,0.4)]",
    iconColor: "text-white",
    shadow: "hover:shadow-[0_12px_32px_rgba(13,148,136,0.22)] dark:hover:shadow-[0_12px_32px_rgba(13,148,136,0.15)]",
    arrowBg: "bg-teal-500/15 text-teal-700 dark:bg-teal-400/20 dark:text-teal-300",
  },
  neutral: {
    bg: "bg-slate-50/80 dark:bg-white/[0.03]",
    border: "border-slate-200/80 dark:border-white/10",
    iconBg: "bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200",
    iconColor: "text-slate-700 dark:text-slate-200",
    shadow: "hover:shadow-md",
    arrowBg: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  },
};

/**
 * Mobile-First Fitness Card
 * Implements Mobile Style Reference Pattern #2:
 * Large full-width rounded card (20-24px radius) with colorful gradient background,
 * an icon/badge, bold title, and one short subtitle. One card = one action.
 */
export const FitnessCard = ({
  title,
  subtitle,
  icon,
  badge,
  actionLabel,
  onClick,
  gradient = "teal",
  rightElement,
  className,
  disabled = false,
}: FitnessCardProps) => {
  const styles = gradientStyles[gradient] || gradientStyles.teal;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={!disabled ? onClick : undefined}
      onKeyDown={
        onClick && !disabled
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={clsx(
        "relative group w-full overflow-hidden rounded-[22px] border p-4 sm:p-5 transition-all duration-200",
        "bg-white dark:bg-fcn-dark/95 backdrop-blur-sm",
        styles.bg,
        styles.border,
        styles.shadow,
        onClick && !disabled && "cursor-pointer active:scale-[0.98] select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          {icon && (
            <div
              className={clsx(
                "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105",
                styles.iconBg
              )}
            >
              {icon}
            </div>
          )}

          <div className="min-w-0">
            {badge && (
              <span className="inline-block px-2 py-0.5 mb-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                {badge}
              </span>
            )}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {rightElement}
          {actionLabel && (
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-600 dark:text-slate-300">
              {actionLabel}
            </span>
          )}
          {onClick && (
            <div
              className={clsx(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5",
                styles.arrowBg
              )}
            >
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { clsx } from "clsx";

export type PageHeaderVariant =
  | "teal"
  | "sky"
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "indigo"
  | "slate";

interface PageHeaderProps {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconVariant?: PageHeaderVariant;
  eyebrow?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  backButton?: {
    to?: string;
    onClick?: () => void;
    label?: string;
  };
  className?: string;
}

const VARIANT_MAP: Record<
  PageHeaderVariant,
  {
    gradient: string;
    shadow: string;
    glow: string;
    ring: string;
    eyebrow: string;
  }
> = {
  teal: {
    gradient: "from-teal-500 via-teal-600 to-emerald-600",
    shadow: "shadow-teal-500/25",
    glow: "bg-teal-500/25",
    ring: "ring-teal-500/20",
    eyebrow:
      "text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border-teal-500/25"
  },
  sky: {
    gradient: "from-sky-500 via-blue-600 to-indigo-600",
    shadow: "shadow-sky-500/25",
    glow: "bg-sky-500/25",
    ring: "ring-sky-500/20",
    eyebrow:
      "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border-sky-500/25"
  },
  emerald: {
    gradient: "from-emerald-500 via-teal-600 to-green-600",
    shadow: "shadow-emerald-500/25",
    glow: "bg-emerald-500/25",
    ring: "ring-emerald-500/20",
    eyebrow:
      "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500/25"
  },
  violet: {
    gradient: "from-violet-500 via-purple-600 to-indigo-600",
    shadow: "shadow-violet-500/25",
    glow: "bg-violet-500/25",
    ring: "ring-violet-500/20",
    eyebrow:
      "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border-violet-500/25"
  },
  rose: {
    gradient: "from-rose-500 via-pink-600 to-red-600",
    shadow: "shadow-rose-500/25",
    glow: "bg-rose-500/25",
    ring: "ring-rose-500/20",
    eyebrow:
      "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-500/25"
  },
  amber: {
    gradient: "from-amber-500 via-amber-600 to-orange-600",
    shadow: "shadow-amber-500/25",
    glow: "bg-amber-500/25",
    ring: "ring-amber-500/20",
    eyebrow:
      "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-500/25"
  },
  indigo: {
    gradient: "from-indigo-600 via-violet-600 to-purple-700",
    shadow: "shadow-indigo-600/25",
    glow: "bg-indigo-600/25",
    ring: "ring-indigo-500/20",
    eyebrow:
      "text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500/25"
  },
  slate: {
    gradient:
      "from-slate-700 via-slate-800 to-slate-900 dark:from-slate-600 dark:to-slate-800",
    shadow: "shadow-slate-500/20",
    glow: "bg-slate-500/20",
    ring: "ring-slate-500/20",
    eyebrow:
      "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-white/10"
  }
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  iconVariant = "teal",
  eyebrow,
  badge,
  actions,
  backButton,
  className
}) => {
  const style = VARIANT_MAP[iconVariant] || VARIANT_MAP.teal;

  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2",
        className
      )}
    >
      <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
        {backButton && (
          <Link
            to={backButton.to || "#"}
            onClick={backButton.onClick}
            className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label={backButton.label || "Go back"}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        )}

        {Icon && (
          <div className="relative shrink-0 group">
            {/* Ambient Ambient Glow */}
            <div
              className={clsx(
                "absolute -inset-1 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity",
                style.glow
              )}
            />
            {/* Squircle Badge */}
            <div
              className={clsx(
                "relative flex h-11 w-11 sm:h-12 sm:w-12 md:h-13 md:w-13 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105 active:scale-95",
                style.gradient,
                style.shadow
              )}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {eyebrow && (
            <div className="mb-1">
              <span
                className={clsx(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border shadow-xs",
                  style.eyebrow
                )}
              >
                {eyebrow}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {title}
            </h1>
            {badge}
          </div>

          {description && (
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start sm:self-auto shrink-0 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

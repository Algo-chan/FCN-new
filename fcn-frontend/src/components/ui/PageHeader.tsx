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

export type PageHeaderLayout = "card" | "plain";

interface PageHeaderProps {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconVariant?: PageHeaderVariant;
  layout?: PageHeaderLayout;
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
    glowBg: string;
    ring: string;
  }
> = {
  teal: {
    gradient: "from-teal-500 via-teal-600 to-emerald-600",
    shadow: "shadow-teal-500/30",
    glow: "bg-teal-500/30",
    glowBg: "bg-teal-500/15 dark:bg-teal-400/10",
    ring: "ring-teal-500/20"
  },
  sky: {
    gradient: "from-sky-500 via-blue-600 to-indigo-600",
    shadow: "shadow-sky-500/30",
    glow: "bg-sky-500/30",
    glowBg: "bg-sky-500/15 dark:bg-sky-400/10",
    ring: "ring-sky-500/20"
  },
  emerald: {
    gradient: "from-emerald-500 via-teal-600 to-green-600",
    shadow: "shadow-emerald-500/30",
    glow: "bg-emerald-500/30",
    glowBg: "bg-emerald-500/15 dark:bg-emerald-400/10",
    ring: "ring-emerald-500/20"
  },
  violet: {
    gradient: "from-violet-500 via-purple-600 to-indigo-600",
    shadow: "shadow-violet-500/30",
    glow: "bg-violet-500/30",
    glowBg: "bg-violet-500/15 dark:bg-violet-400/10",
    ring: "ring-violet-500/20"
  },
  rose: {
    gradient: "from-rose-500 via-pink-600 to-red-600",
    shadow: "shadow-rose-500/30",
    glow: "bg-rose-500/30",
    glowBg: "bg-rose-500/15 dark:bg-rose-400/10",
    ring: "ring-rose-500/20"
  },
  amber: {
    gradient: "from-amber-500 via-amber-600 to-orange-600",
    shadow: "shadow-amber-500/30",
    glow: "bg-amber-500/30",
    glowBg: "bg-amber-500/15 dark:bg-amber-400/10",
    ring: "ring-amber-500/20"
  },
  indigo: {
    gradient: "from-indigo-600 via-violet-600 to-purple-700",
    shadow: "shadow-indigo-600/30",
    glow: "bg-indigo-600/30",
    glowBg: "bg-indigo-600/15 dark:bg-indigo-400/10",
    ring: "ring-indigo-500/20"
  },
  slate: {
    gradient:
      "from-slate-700 via-slate-800 to-slate-900 dark:from-slate-600 dark:to-slate-800",
    shadow: "shadow-slate-500/20",
    glow: "bg-slate-500/20",
    glowBg: "bg-slate-500/10 dark:bg-slate-400/10",
    ring: "ring-slate-500/20"
  }
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  iconVariant = "teal",
  layout = "card",
  badge,
  actions,
  backButton,
  className
}) => {
  const style = VARIANT_MAP[iconVariant] || VARIANT_MAP.teal;
  const isCard = layout === "card";

  return (
    <div
      className={clsx(
        "relative transition-all duration-200",
        isCard
          ? "overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 md:p-6 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.05)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.35)]"
          : "pb-2",
        className
      )}
    >
      {/* Ambient Radial Aura for Card Layout */}
      {isCard && (
        <div
          className={clsx(
            "absolute -top-16 -right-16 w-56 h-56 sm:w-72 sm:h-72 rounded-full blur-3xl pointer-events-none transition-opacity",
            style.glowBg
          )}
        />
      )}

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Side: Back button + Icon + Text hierarchy */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {backButton && (
            <Link
              to={backButton.to || "#"}
              onClick={backButton.onClick}
              className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all active:scale-95"
              aria-label={backButton.label || "Go back"}
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          )}

          {Icon && (
            <div className="relative shrink-0 group">
              {/* Ambient Glow */}
              <div
                className={clsx(
                  "absolute -inset-1 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity",
                  style.glow
                )}
              />
              {/* Responsive Squircle Badge */}
              <div
                className={clsx(
                  "relative flex h-11 w-11 sm:h-12 sm:w-12 md:h-13 md:w-13 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br text-white shadow-md ring-1 ring-inset ring-white/30 transition-transform duration-300 group-hover:scale-105 active:scale-95",
                  style.gradient,
                  style.shadow
                )}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                {title}
              </h1>
              {badge}
            </div>

            {description && (
              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300/90 leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right Side / Mobile Bottom Actions */}
        {actions && (
          <div className="relative z-10 flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t border-slate-100 dark:border-white/5 sm:border-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

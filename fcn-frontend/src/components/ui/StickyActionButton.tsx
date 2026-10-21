import { type ReactNode } from "react";
import { clsx } from "clsx";
import { Spinner } from "@/components/ui/Spinner";

export interface StickyActionButtonProps {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  subtitle?: string;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}

/**
 * Mobile-First Sticky Action Button
 *
 * Implements Mobile Style Reference Pattern #3:
 * Prominent sticky primary button at the bottom of key flows (book appointment,
 * start symptom check, confirm), at least 52px tall, full width, gradient fill,
 * press animation, safe-area inset aware.
 */
export const StickyActionButton = ({
  label,
  onClick,
  icon,
  disabled = false,
  loading = false,
  subtitle,
  className,
  variant = "primary",
}: StickyActionButtonProps) => {
  return (
    <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 p-3 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] lg:static lg:p-0 lg:bg-transparent lg:border-0 lg:shadow-none lg:backdrop-blur-none">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className={clsx(
          "w-full min-h-[52px] sm:min-h-[48px] px-6 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-white tracking-tight select-none transition-all duration-150",
          variant === "primary" &&
            "bg-gradient-to-r from-teal-600 via-teal-500 to-sky-600 shadow-[0_8px_24px_rgba(13,148,136,0.35)] hover:shadow-[0_12px_28px_rgba(13,148,136,0.45)] hover:brightness-105 active:scale-[0.98]",
          variant === "secondary" &&
            "bg-slate-800 text-white hover:bg-slate-700 active:scale-[0.98]",
          variant === "danger" &&
            "bg-gradient-to-r from-rose-600 to-rose-500 shadow-[0_8px_24px_rgba(225,29,72,0.35)] active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none",
          className
        )}
      >
        {loading ? (
          <Spinner size="sm" color="border-current" />
        ) : (
          <>
            {icon && <span className="text-xl shrink-0">{icon}</span>}
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-sm font-bold">{label}</span>
              {subtitle && (
                <span className="text-[11px] font-normal text-white/80">{subtitle}</span>
              )}
            </div>
          </>
        )}
      </button>
    </div>
  );
};

import { type PropsWithChildren } from "react";
import { clsx } from "clsx";

export interface BadgeProps extends PropsWithChildren {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
  className?: string;
}

const variantClasses = {
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
  warning: "bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
  danger: "bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40",
  info: "bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
  primary: "bg-teal-50 text-teal-800 border border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40",
  neutral: "bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/50"
};

const dotClasses = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-sky-500",
  primary: "bg-teal-500",
  neutral: "bg-slate-400 dark:bg-slate-500"
};

export const Badge = ({
  children,
  variant = "neutral",
  size = "md",
  dot = true,
  className
}: BadgeProps) => (
  <span
    className={clsx(
      "inline-flex items-center gap-1.5 rounded-full font-semibold tracking-tight transition-colors",
      variantClasses[variant],
      size === "sm" ? "px-2.5 py-0.5 text-xs" : size === "lg" ? "px-3.5 py-1.5 text-sm" : "px-3 py-1 text-xs",
      className
    )}
  >
    {dot && <span className={clsx("h-1.5 w-1.5 rounded-full shrink-0", dotClasses[variant])} />}
    {children}
  </span>
);

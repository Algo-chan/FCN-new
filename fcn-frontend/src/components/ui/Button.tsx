import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Spinner } from "@/components/ui/Spinner";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "action";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses = {
  primary:
    "bg-fcn-primary text-white shadow-sm hover:bg-fcn-primary-hover hover:shadow-[0_4px_16px_rgba(13,148,136,0.3)] active:scale-[0.98]",
  action:
    "bg-gradient-to-r from-teal-600 via-teal-500 to-sky-600 text-white font-bold shadow-[0_6px_20px_rgba(13,148,136,0.35)] hover:shadow-[0_8px_24px_rgba(13,148,136,0.45)] hover:brightness-105 active:scale-[0.98]",
  secondary:
    "bg-white text-fcn-text-light ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-fcn-primary/30 active:scale-[0.98] dark:bg-fcn-surface-dark dark:text-fcn-text-dark dark:ring-white/10 dark:hover:bg-slate-800",
  ghost:
    "bg-transparent text-fcn-primary hover:bg-fcn-primary/10 active:scale-[0.98] dark:hover:bg-fcn-primary/15",
  danger:
    "bg-fcn-danger text-white shadow-sm hover:brightness-95 hover:shadow-[0_4px_16px_rgba(225,29,72,0.3)] active:scale-[0.98]"
};

const sizeClasses = {
  sm: "min-h-[38px] px-3.5 text-xs rounded-lg font-medium",
  md: "min-h-[46px] sm:min-h-[42px] px-4 text-sm rounded-xl font-semibold",
  lg: "min-h-[52px] px-5 text-base rounded-xl font-bold tracking-tight",
  xl: "min-h-[56px] px-6 text-lg rounded-2xl font-extrabold tracking-tight"
};

export const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  icon,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={twMerge(
      clsx(
        "inline-flex items-center justify-center gap-2 select-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-fcn-accent focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variantClasses[variant],
        sizeClasses[size],
        className
      )
    )}
    {...props}
  >
    {loading ? <Spinner size="sm" color="border-current" /> : icon}
    {children}
  </button>
);

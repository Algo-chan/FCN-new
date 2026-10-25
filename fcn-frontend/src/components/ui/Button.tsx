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
    "bg-fcn-primary text-white shadow-sm hover:shadow-[0_0_24px_rgba(45,212,191,0.35)] active:scale-[0.98]",
  action:
    "bg-gradient-to-r from-[#0A7EA4] to-[#2DD4BF] text-white font-bold shadow-[0_4px_16px_rgba(10,126,164,0.3)] hover:shadow-[0_0_24px_rgba(45,212,191,0.45)] active:scale-[0.98]",
  secondary:
    "bg-white text-fcn-text-light ring-1 ring-fcn-primary/20 hover:bg-fcn-light active:scale-[0.98] dark:bg-fcn-dark dark:text-fcn-text-dark dark:ring-white/10 dark:hover:bg-slate-800",
  ghost:
    "bg-transparent text-fcn-primary hover:bg-fcn-primary/10 active:scale-[0.98] dark:hover:bg-fcn-primary/15",
  danger:
    "bg-fcn-danger text-white shadow-sm hover:shadow-[0_0_20px_rgba(248,113,113,0.35)] active:scale-[0.98]"
};

const sizeClasses = {
  sm: "h-9 px-3 text-xs rounded-md font-medium",
  md: "h-11 px-4 text-sm rounded-md font-medium",
  lg: "h-12 px-5 text-base rounded-md font-bold tracking-tight",
  xl: "min-h-[52px] px-6 text-lg rounded-xl font-bold tracking-tight"
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
        "inline-flex items-center justify-center gap-2 select-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-fcn-accent focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
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

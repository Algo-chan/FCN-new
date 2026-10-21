import { type PropsWithChildren } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends PropsWithChildren {
  className?: string;
  hoverable?: boolean;
  glow?: boolean;
  variant?: "default" | "fitness" | "subtle";
  onClick?: () => void;
}

export const Card = ({
  children,
  className,
  hoverable = false,
  glow = false,
  variant = "default",
  onClick,
}: CardProps) => (
  <div
    className={twMerge(
      clsx(
        "relative transition-all duration-200 border",
        // Variants
        variant === "fitness"
          ? "rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white/95 dark:bg-fcn-surface-dark border-slate-200/80 dark:border-white/10 shadow-card-soft dark:shadow-card-soft-dark"
          : variant === "subtle"
          ? "rounded-2xl p-4 sm:p-5 bg-fcn-surface-subtleLight dark:bg-fcn-surface-subtleDark border-transparent"
          : "rounded-2xl p-5 bg-white dark:bg-fcn-surface-dark border-slate-200/70 dark:border-white/10 shadow-card-soft dark:shadow-card-soft-dark",
        // Interactive states
        hoverable &&
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-fcn-primary/30 active:scale-[0.99]",
        glow &&
          "border-fcn-primary/40 shadow-glow-teal",
        className
      )
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

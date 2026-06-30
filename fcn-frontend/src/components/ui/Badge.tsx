import { type PropsWithChildren } from "react";
import { clsx } from "clsx";

interface BadgeProps extends PropsWithChildren {
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
}

const variantClasses = {
  success: "bg-fcn-success/10 text-fcn-success",
  warning: "bg-fcn-warning/10 text-fcn-warning",
  danger: "bg-fcn-danger/10 text-fcn-danger",
  info: "bg-fcn-primary/10 text-fcn-primary",
  neutral: "bg-fcn-text-light/10 text-fcn-text-light dark:text-fcn-text-dark"
};

const dotClasses = {
  success: "bg-fcn-success",
  warning: "bg-fcn-warning",
  danger: "bg-fcn-danger",
  info: "bg-fcn-primary",
  neutral: "bg-fcn-text-light dark:bg-fcn-text-dark"
};

export const Badge = ({ children, variant = "neutral", size = "md" }: BadgeProps) => (
  <span
    className={clsx(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      variantClasses[variant],
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm"
    )}
  >
    <span className={clsx("h-1.5 w-1.5 rounded-full", dotClasses[variant])} />
    {children}
  </span>
);

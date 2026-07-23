import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Spinner } from "@/components/ui/Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
}

const variantClasses = {
  primary: "bg-fcn-primary text-white hover:shadow-[0_0_24px_rgba(45,212,191,0.35)]",
  secondary: "bg-white text-fcn-text-light ring-1 ring-fcn-primary/20 hover:bg-fcn-light dark:bg-fcn-dark dark:text-fcn-text-dark",
  ghost: "bg-transparent text-fcn-primary hover:bg-fcn-primary/10",
  danger: "bg-fcn-danger text-white hover:shadow-[0_0_20px_rgba(248,113,113,0.35)]"
};

const sizeClasses = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base"
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
}: ButtonProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      whileHover={shouldReduceMotion || disabled ? {} : { scale: 1.02 }}
      whileTap={shouldReduceMotion || disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={twMerge(
        clsx(
          "inline-flex items-center justify-center gap-2 rounded-md font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-fcn-accent focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className
        )
      )}
      {...(props as any)}
    >
      {loading ? <Spinner size="sm" color="border-current" /> : icon}
      {children}
    </motion.button>
  );
};

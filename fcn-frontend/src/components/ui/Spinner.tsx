import { clsx } from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4"
};

export const Spinner = ({ size = "md", color = "border-fcn-accent" }: SpinnerProps) => (
  <span
    className={clsx(
      "inline-block animate-spin rounded-full border-current border-r-transparent",
      sizeClasses[size],
      color
    )}
    aria-label="Loading"
  />
);

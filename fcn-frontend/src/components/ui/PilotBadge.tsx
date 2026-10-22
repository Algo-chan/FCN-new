import { clsx } from "clsx";

interface PilotBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "solid" | "subtle" | "glow";
  className?: string;
}

export const PilotBadge = ({
  size = "sm",
  variant = "subtle",
  className
}: PilotBadgeProps) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-bold rounded-full select-none tracking-tight transition-all",
        // Sizes
        size === "xs" && "px-2 py-0.5 text-[10px]",
        size === "sm" && "px-2.5 py-0.5 text-[11px]",
        size === "md" && "px-3 py-1 text-xs",
        size === "lg" && "px-3.5 py-1.5 text-sm",
        // Variants
        variant === "subtle" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25",
        variant === "solid" &&
          "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs shadow-emerald-500/20",
        variant === "glow" &&
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
        className
      )}
    >
      <span>FREE during pilot</span>
      <span className="inline-block transform-gpu group-hover:rotate-12 transition-transform">
        🎉
      </span>
    </span>
  );
};

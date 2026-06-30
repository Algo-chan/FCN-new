import { type PropsWithChildren } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends PropsWithChildren {
  className?: string;
  hoverable?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className, hoverable = false, glow = false, onClick }: CardProps) => (
  <div
    className={twMerge(
      clsx(
        "rounded-lg border border-fcn-primary/10 bg-white/80 p-5 shadow-sm backdrop-blur dark:bg-fcn-dark/70",
        hoverable && "card-hover",
        glow && "border-fcn-accent/50 shadow-[0_0_24px_rgba(45,212,191,0.16)]",
        className
      )
    )}
    onClick={onClick}
  >
    {children}
  </div>
);

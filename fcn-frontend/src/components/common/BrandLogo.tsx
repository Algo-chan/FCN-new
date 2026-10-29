import React from "react";
import { clsx } from "clsx";

export interface BrandLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "adaptive" | "light" | "dark" | "icon" | "maskable";
  className?: string;
  alt?: string;
  priority?: boolean;
}

/**
 * Fast Care Now Brand Logo Component
 * Built on the unified vector brand kit in /fcn-brand
 *
 * Variants:
 * - "adaptive": Automatically swaps light/dark SVG based on Tailwind .dark class (zero flash)
 * - "light": Always renders dark wordmark on light backgrounds (fcn-logo-light.svg)
 * - "dark": Always renders white wordmark on dark backgrounds (fcn-logo-dark.svg)
 * - "icon": Renders the standalone square cross-pulse app icon (fcn-icon.svg)
 * - "maskable": Renders the maskable PWA app icon (icon-maskable.svg)
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = "adaptive",
  className = "h-8 w-auto",
  alt = "Fast Care Now",
  priority = false,
  ...rest
}) => {
  if (variant === "icon") {
    return (
      <img
        src="/fcn-brand/svg/fcn-icon.svg"
        alt={alt}
        className={clsx("object-contain", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...rest}
      />
    );
  }

  if (variant === "maskable") {
    return (
      <img
        src="/fcn-brand/svg/icon-maskable.svg"
        alt={alt}
        className={clsx("object-contain", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...rest}
      />
    );
  }

  if (variant === "light") {
    return (
      <img
        src="/fcn-brand/svg/fcn-logo-light.svg"
        alt={alt}
        className={clsx("object-contain", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...rest}
      />
    );
  }

  if (variant === "dark") {
    return (
      <img
        src="/fcn-brand/svg/fcn-logo-dark.svg"
        alt={alt}
        className={clsx("object-contain", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...rest}
      />
    );
  }

  // Adaptive mode: render both and toggle cleanly with Tailwind's dark class
  return (
    <span className="inline-flex items-center">
      <img
        src="/fcn-brand/svg/fcn-logo-light.svg"
        alt={alt}
        className={clsx("object-contain dark:hidden", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...rest}
      />
      <img
        src="/fcn-brand/svg/fcn-logo-dark.svg"
        alt={alt}
        className={clsx("hidden object-contain dark:block", className)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...rest}
      />
    </span>
  );
};

export default BrandLogo;

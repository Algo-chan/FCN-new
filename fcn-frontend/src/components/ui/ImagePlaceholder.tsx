import { ImageIcon } from "lucide-react";
import { clsx } from "clsx";

interface ImagePlaceholderProps {
  query?: string;
  alt?: string;
  aspectRatio?: string;
  className?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const roundedMap: Record<string, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full"
};

export const ImagePlaceholder = ({ alt, query, aspectRatio = "4/3", className, rounded = "xl" }: ImagePlaceholderProps) => {
  const roundedClass = roundedMap[rounded] ?? "rounded-xl";

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center bg-gradient-to-br from-fcn-primary/20 to-fcn-accent/20",
        roundedClass,
        className
      )}
      style={{ aspectRatio }}
      role="img"
      aria-label={alt}
    >
      <ImageIcon className="h-10 w-10 text-fcn-primary/40" />
      {import.meta.env.DEV && query && (
        <p className="mt-2 max-w-xs px-4 text-center text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          {query}
        </p>
      )}
    </div>
  );
};

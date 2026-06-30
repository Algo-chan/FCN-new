import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export const SkeletonCard = ({ className, lines = 3 }: SkeletonCardProps) => (
  <Card className={clsx("animate-pulse", className)}>
    <div className="mb-3 h-4 w-24 rounded bg-fcn-primary/10" />
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={clsx(
          "mt-2 h-3 rounded bg-fcn-primary/10",
          i % 2 === 0 ? "w-full" : "w-3/4"
        )}
      />
    ))}
  </Card>
);

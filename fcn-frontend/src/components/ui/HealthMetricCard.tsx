import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import type { VitalStatus } from "@/types";

interface HealthMetricCardProps {
  label: string;
  value: number;
  unit: string;
  status: VitalStatus;
  icon: ReactNode;
  trend?: "up" | "down" | "stable";
}

const statusClasses: Record<VitalStatus, string> = {
  normal: "border-l-fcn-success",
  warning: "border-l-fcn-warning",
  critical: "border-l-fcn-danger"
};

const TrendIcon = ({ trend }: { trend: NonNullable<HealthMetricCardProps["trend"]> }) => {
  if (trend === "up") {
    return <ArrowUp className="h-4 w-4" />;
  }

  if (trend === "down") {
    return <ArrowDown className="h-4 w-4" />;
  }

  return <ArrowRight className="h-4 w-4" />;
};

export const HealthMetricCard = ({ label, value, unit, status, icon, trend = "stable" }: HealthMetricCardProps) => {
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const target = valueRef.current;

    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (target) {
        target.textContent = String(value);
      }
      return;
    }

    const counter = { value: 0 };
    gsap.to(counter, {
      value,
      duration: 0.7,
      ease: "power2.out",
      onUpdate: () => {
        target.textContent = Math.round(counter.value).toString();
      }
    });
  }, [value]);

  return (
    <Card className={clsx("border-l-4", statusClasses[status])} hoverable>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-fcn-text-light/65 dark:text-fcn-text-dark/65">{label}</p>
          <p className="mt-2 flex items-end gap-1 text-2xl font-semibold text-fcn-text-light dark:text-fcn-text-dark">
            <span ref={valueRef}>{value}</span>
            <span className="pb-1 text-sm font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">{unit}</span>
          </p>
        </div>
        <div className="rounded-md bg-fcn-primary/10 p-2 text-fcn-primary">{icon}</div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">
        <TrendIcon trend={trend} />
        <span>{trend}</span>
      </div>
    </Card>
  );
};

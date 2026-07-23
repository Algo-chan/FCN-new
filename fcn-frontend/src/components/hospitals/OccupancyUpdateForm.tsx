import { useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { motion } from "motion/react";
import { clsx } from "clsx";
import { hospitalsService } from "@/services/hospitals.service";
import { useSound } from "@/hooks/useSound";
import { useNotifications } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Hospital, OccupancyBand } from "@/types";

interface OccupancyUpdateFormProps {
  hospitalId: string;
  currentData: Hospital;
  onSuccess: () => void;
}

const OccupancySchema = z.object({
  total_beds: z.coerce.number().int().min(1, "Must be at least 1"),
  occupied_beds: z.coerce.number().int().min(0, "Cannot be negative"),
  active_doctors_count: z.coerce.number().int().min(0, "Cannot be negative"),
  avg_wait_minutes: z.coerce.number().int().min(0, "Cannot be negative")
}).refine((data) => data.occupied_beds <= data.total_beds, {
  message: "Occupied beds cannot exceed total beds",
  path: ["occupied_beds"]
});

type OccupancyFormData = z.infer<typeof OccupancySchema>;

const bandConfig: Record<OccupancyBand, { label: string; barColor: string }> = {
  low: { label: "Not Busy", barColor: "bg-fcn-success" },
  moderate: { label: "Moderately Busy", barColor: "bg-fcn-warning" },
  high: { label: "Very Busy", barColor: "bg-fcn-danger" }
};

const computeBand = (total: number, occupied: number): OccupancyBand => {
  if (total <= 0) {
    return "low";
  }
  const pct = (occupied / total) * 100;
  if (pct > 75) {
    return "high";
  }
  if (pct >= 50) {
    return "moderate";
  }
  return "low";
};

export const OccupancyUpdateForm = ({ hospitalId, currentData, onSuccess }: OccupancyUpdateFormProps) => {
  const { playSuccess } = useSound();
  const { addToast } = useNotifications();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid }
  } = useForm<OccupancyFormData>({
    resolver: zodResolver(OccupancySchema),
    mode: "onChange",
    defaultValues: {
      total_beds: currentData.total_beds,
      occupied_beds: currentData.occupied_beds,
      active_doctors_count: currentData.active_doctors_count,
      avg_wait_minutes: currentData.avg_wait_minutes
    }
  });

  const watchedTotal = watch("total_beds");
  const watchedOccupied = watch("occupied_beds");
  const previewPercent = useMemo(() => {
    if (watchedTotal > 0) {
      return Math.round((watchedOccupied / watchedTotal) * 100);
    }
    return 0;
  }, [watchedTotal, watchedOccupied]);

  const previewBand = computeBand(watchedTotal, watchedOccupied);
  const previewConfig = bandConfig[previewBand];

  const onSubmit = useCallback(async (data: OccupancyFormData) => {
    try {
      const response = await hospitalsService.updateOccupancy(hospitalId, data);
      if (response.success) {
        playSuccess();
        addToast({ type: "success", title: "Occupancy data updated successfully" });
        onSuccess();
      } else {
        addToast({ type: "danger", title: "Update failed", message: response.error?.message });
      }
    } catch {
      addToast({ type: "danger", title: "Update failed", message: "Unable to connect to server" });
    }
  }, [hospitalId, playSuccess, addToast, onSuccess]);

  return (
    <Card>
      <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
        Update {currentData.name} Occupancy Data
      </h2>
      <p className="mt-1 text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
        Last updated {formatDistanceToNow(new Date(currentData.last_updated_at), { addSuffix: true })}
      </p>

      <div className="mt-4">
        <p className="mb-1 text-sm font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70">
          Preview: {previewPercent}% occupied — {previewConfig.label}
        </p>
        <div className="h-3 overflow-hidden rounded-full bg-fcn-primary/10">
          <motion.div
            className={clsx("h-full rounded-full", previewConfig.barColor)}
            animate={{ width: `${previewPercent}%` }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Total Beds"
            type="number"
            error={errors.total_beds?.message}
            {...register("total_beds")}
          />
          <Input
            label="Occupied Beds"
            type="number"
            error={errors.occupied_beds?.message}
            {...register("occupied_beds")}
          />
          <Input
            label="Active Doctors"
            type="number"
            error={errors.active_doctors_count?.message}
            {...register("active_doctors_count")}
          />
          <Input
            label="Avg Wait Time (min)"
            type="number"
            error={errors.avg_wait_minutes?.message}
            {...register("avg_wait_minutes")}
          />
        </div>

        <Button type="submit" loading={isSubmitting} disabled={!isValid} size="lg" className="w-full">
          Update Occupancy Data
        </Button>
      </form>
    </Card>
  );
};

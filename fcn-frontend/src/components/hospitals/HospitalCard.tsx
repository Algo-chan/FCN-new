import { useCallback, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Clock, MapPin, Stethoscope, Users } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ImagePlaceholder } from "@/components/landing/ImagePlaceholder";
import type { Hospital, OccupancyBand } from "@/types";

interface HospitalCardProps {
  hospital: Hospital;
  onClick?: () => void;
  index?: number;
}

const bandConfig: Record<OccupancyBand, { label: string; emoji: string; color: string; barColor: string }> = {
  low: { label: "Not Busy", emoji: "🟢", color: "text-fcn-success", barColor: "bg-fcn-success" },
  moderate: { label: "Moderately Busy", emoji: "🟡", color: "text-fcn-warning", barColor: "bg-fcn-warning" },
  high: { label: "Very Busy", emoji: "🔴", color: "text-fcn-danger", barColor: "bg-fcn-danger" }
};

const isStale = (lastUpdated: string): boolean => {
  const updated = new Date(lastUpdated);
  const now = new Date();
  return (now.getTime() - updated.getTime()) > 60 * 60 * 1000;
};

export const HospitalCard = ({ hospital, onClick, index = 0 }: HospitalCardProps) => {
  const [imgError, setImgError] = useState(false);
  const band = bandConfig[hospital.occupancy_band];
  const stale = isStale(hospital.last_updated_at);
  const freePercent = 100 - hospital.occupancy_percent;

  const displayedSpecialties = hospital.specialties.slice(0, 3);
  const extraCount = hospital.specialties.length - 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
    >
      <Card hoverable className="cursor-pointer overflow-hidden p-0" onClick={onClick}>
        <div className="relative">
          <ImagePlaceholder
            query={`${hospital.name} exterior, modern East African hospital building, daytime`}
            alt={hospital.name}
            aspectRatio="16/9"
            className="rounded-t-xl"
            rounded="none"
          />
          {hospital.status === "active" && (
            <div className="absolute right-2 top-2">
              <Badge variant="success" size="sm">Open</Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
            {hospital.name}
          </h3>
          <div className="mt-1 flex items-center gap-1 text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            <MapPin className="h-3.5 w-3.5" />
            {hospital.location}
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <span className={clsx("text-sm font-medium", band.color)}>
                {band.emoji} {band.label}
              </span>
              <span className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                {hospital.occupancy_percent}% occupied
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-fcn-primary/10">
              <motion.div
                className={clsx("h-full rounded-full", band.barColor)}
                initial={{ width: 0 }}
                animate={{ width: `${hospital.occupancy_percent}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Stethoscope className="h-4 w-4 text-fcn-primary" />
              <span className="text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                {hospital.active_doctors_count} Doctors
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-fcn-primary" />
              <span className="text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                ~{hospital.avg_wait_minutes} min
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-fcn-primary" />
              <span className="text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                {hospital.total_beds} Beds
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                {freePercent}% Free
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {displayedSpecialties.map((s) => (
              <span
                key={s}
                className="rounded-full bg-fcn-primary/10 px-2.5 py-0.5 text-xs text-fcn-primary"
              >
                {s}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="rounded-full bg-fcn-text-light/10 px-2.5 py-0.5 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                +{extraCount} more
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
              Updated {formatDistanceToNow(new Date(hospital.last_updated_at), { addSuffix: true })}
            </span>
            {stale && (
              <span className="flex items-center gap-1 text-xs text-fcn-warning">
                <AlertTriangle className="h-3 w-3 animate-pulse" />
                Data may be outdated
              </span>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

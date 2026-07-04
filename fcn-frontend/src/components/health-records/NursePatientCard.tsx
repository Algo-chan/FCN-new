import { motion } from "framer-motion";
import { clsx } from "clsx";
import { Heart, Droplets, Thermometer, Wind, Activity, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface MiniVitals {
  bp_systolic: number | null;
  bp_diastolic: number | null;
  spo2_percent: number | null;
  heart_rate_bpm: number | null;
  temperature_celsius: number | null;
  recorded_at: string | null;
}

interface NursePatientCardProps {
  patientId: string;
  fullName: string;
  phone: string;
  latestVitals: MiniVitals | null;
  appointmentDate: string;
}

function timeAgo(d: string | null): string {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const NursePatientCard = ({
  patientId,
  fullName,
  phone,
  latestVitals,
  appointmentDate
}: NursePatientCardProps) => {
  const hasVitals = latestVitals?.bp_systolic != null || latestVitals?.spo2_percent != null;
  const isSpo2Critical = latestVitals?.spo2_percent != null && latestVitals.spo2_percent < 95;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-fcn-dark",
        isSpo2Critical ? "border-red-300 dark:border-red-800" : "border-fcn-primary/10"
      )}
    >
      {/* Critical indicator */}
      {isSpo2Critical && (
        <div className="absolute right-2 top-2 flex h-5 items-center gap-1 rounded-full bg-red-100 px-2 text-[10px] font-semibold text-red-600 dark:bg-red-950/30">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          Critical
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-bold text-fcn-text-light dark:text-fcn-text-dark">
            {fullName}
          </h4>
          <p className="mt-0.5 text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            {phone}
          </p>
        </div>
        <div className="text-right text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
          <div>Appointment</div>
          <div>{timeAgo(appointmentDate)}</div>
        </div>
      </div>

      {hasVitals ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {latestVitals.bp_systolic != null && (
            <MiniTile
              icon={<Heart className="h-3 w-3" />}
              value={`${latestVitals.bp_systolic}/${latestVitals.bp_diastolic ?? "—"}`}
              label="BP"
            />
          )}
          {latestVitals.spo2_percent != null && (
            <MiniTile
              icon={<Wind className="h-3 w-3" />}
              value={`${latestVitals.spo2_percent}%`}
              label="SpO2"
              critical={isSpo2Critical}
            />
          )}
          {latestVitals.heart_rate_bpm != null && (
            <MiniTile
              icon={<Activity className="h-3 w-3" />}
              value={`${latestVitals.heart_rate_bpm}`}
              label="HR"
            />
          )}
          {latestVitals.temperature_celsius != null && (
            <MiniTile
              icon={<Thermometer className="h-3 w-3" />}
              value={`${latestVitals.temperature_celsius}°`}
              label="Temp"
            />
          )}
        </div>
      ) : (
        <p className="mt-3 text-[10px] italic text-fcn-text-light/40 dark:text-fcn-text-dark/40">
          No vitals recorded yet
        </p>
      )}

      {latestVitals?.recorded_at && (
        <p className="mt-2 text-[9px] text-fcn-text-light/30 dark:text-fcn-text-dark/30">
          Last updated: {timeAgo(latestVitals.recorded_at)}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Link
          to={`/health-records/patient/${patientId}`}
          className="inline-flex items-center gap-1 rounded-md bg-fcn-primary px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-fcn-primary/90"
        >
          Record Vitals
          <ChevronRight className="h-3 w-3" />
        </Link>
        <Link
          to={`/health-records/patient/${patientId}/view`}
          className="inline-flex items-center gap-1 rounded-md border border-fcn-primary/20 px-3 py-1.5 text-[11px] font-medium text-fcn-text-light/70 transition hover:bg-fcn-primary/5 dark:text-fcn-text-dark/70"
        >
          View History
        </Link>
      </div>
    </motion.div>
  );
};

function MiniTile({
  icon, value, label, critical
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  critical?: boolean;
}) {
  return (
    <div className={clsx(
      "rounded-lg border p-2 text-center",
      critical
        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
        : "border-fcn-primary/10 bg-fcn-light/50 dark:bg-fcn-dark/50"
    )}>
      <div className={clsx("mb-0.5", critical ? "text-red-500" : "text-fcn-accent")}>
        {icon}
      </div>
      <div className={clsx(
        "font-mono text-xs font-bold",
        critical ? "text-red-600" : "text-fcn-text-light dark:text-fcn-text-dark"
      )}>
        {value}
      </div>
      <div className="text-[9px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">{label}</div>
    </div>
  );
}

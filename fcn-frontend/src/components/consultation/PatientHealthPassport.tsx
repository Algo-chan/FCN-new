import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Heart,
  Activity,
  Droplets,
  Thermometer,
  Weight,
  Shield,
  AlertTriangle,
  Pill,
  Calendar,
  User,
  Phone,
  Clock,
  ExternalLink
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { ConsultationContext } from "@/types";
import { clsx } from "clsx";

interface HealthPassportProps {
  context: ConsultationContext | null;
  isLoading: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  alwaysVisible?: boolean;
}

function CollapsibleSection({ title, icon, defaultOpen = false, children, alwaysVisible = false }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (alwaysVisible) {
    return <div className="mb-3">{children}</div>;
  }

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-fcn-primary/5"
      >
        <span className="text-fcn-primary">{icon}</span>
        <span className="flex-1 text-xs font-bold uppercase tracking-wider text-fcn-text-light dark:text-fcn-text-dark">{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-fcn-text-light/40 dark:text-fcn-text-dark/40" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-fcn-primary/5 px-4 py-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function VitalCard({
  icon,
  label,
  value,
  unit,
  status
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  unit?: string;
  status?: "normal" | "warning" | "critical";
}) {
  const statusColors = {
    normal: "border-fcn-primary/10",
    warning: "border-amber-500/50 bg-amber-500/5",
    critical: "border-rose-500/50 bg-rose-500/5"
  };

  return (
    <div
      className={clsx(
        "rounded-xl border bg-fcn-surface-light/60 dark:bg-fcn-dark/60 p-3 transition-shadow hover:shadow-xs",
        status ? statusColors[status] : "border-fcn-primary/10"
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-fcn-primary">{icon}</span>
        <span className="text-[11px] font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-base font-bold text-fcn-text-light dark:text-fcn-text-dark">
          {value !== null && value !== undefined ? value : "—"}
        </span>
        {unit && <span className="text-[10px] font-medium text-fcn-text-light/50 dark:text-fcn-text-dark/50">{unit}</span>}
      </div>
    </div>
  );
}

function Badge({ label, variant = "teal" }: { label: string; variant?: "teal" | "red" | "green" }) {
  const variants = {
    teal: "bg-fcn-primary/10 text-fcn-primary border-fcn-primary/20",
    red: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
  };

  return (
    <span className={clsx("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", variants[variant])}>
      {variant === "red" && <AlertTriangle className="mr-1 inline h-3 w-3" />}
      {label}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-xl bg-fcn-primary/10", className)} />;
}

export function PatientHealthPassport({ context, isLoading }: HealthPassportProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!context?.consultationContext) {
    if (!context) return null;

    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fcn-primary to-fcn-accent text-lg font-bold text-white shadow-sm">
            {context.appointment.doctor.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-fcn-text-light dark:text-fcn-text-dark">
              {context.appointment.doctor.full_name}
            </h3>
            <p className="text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              {context.appointment.doctor.specialty ?? "Physician"}
            </p>
            {context.appointment.doctor.bio && (
              <p className="mt-1 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 line-clamp-2">
                {context.appointment.doctor.bio}
              </p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark p-4 shadow-sm">
          <p className="text-xs font-semibold text-fcn-text-light/80 dark:text-fcn-text-dark/80">
            Appointment Time: {format(new Date(context.appointment.scheduled_at), "MMM d, yyyy • hh:mm a")}
          </p>
          {context.appointment.chief_complaint && (
            <p className="mt-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              Reason for Visit: <strong className="text-fcn-text-light dark:text-fcn-text-dark">{context.appointment.chief_complaint}</strong>
            </p>
          )}
        </div>
      </div>
    );
  }

  const { patient, patientProfile, latestVitals, activePrescriptions, appointmentHistory } =
    context.consultationContext;

  const age = patientProfile?.date_of_birth
    ? Math.floor(
        (new Date().getTime() - new Date(patientProfile.date_of_birth).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 space-y-4">
      {/* Patient Header Card */}
      <div className="rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fcn-primary to-fcn-accent text-lg font-bold text-white shadow-sm">
            {patient.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-fcn-text-light dark:text-fcn-text-dark">{patient.full_name}</h3>
            <div className="flex items-center gap-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
              {age !== null && <span>{age} years old</span>}
              {patientProfile?.blood_type && (
                <Badge label={`Blood ${patientProfile.blood_type}`} variant="teal" />
              )}
            </div>
          </div>
        </div>

        {patientProfile?.emergency_contact_name && (
          <div className="mt-3 pt-3 border-t border-fcn-primary/5 flex items-center gap-1.5 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            <Phone className="h-3.5 w-3.5 text-fcn-primary" />
            <span>Emergency: {patientProfile.emergency_contact_name}</span>
            {patientProfile.emergency_contact_phone && (
              <span className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                ({patientProfile.emergency_contact_phone})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Critical Flags / Allergies */}
      <div className="rounded-2xl border border-rose-500/15 bg-rose-500/5 p-4 shadow-sm space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          Critical Flags & Allergies
        </h4>
        {patientProfile?.known_allergies ? (
          <div className="flex flex-wrap gap-1.5">
            {patientProfile.known_allergies.split(",").map((a) => (
              <Badge key={a.trim()} label={a.trim()} variant="red" />
            ))}
          </div>
        ) : (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ No known drug allergies</p>
        )}
        {patientProfile?.chronic_conditions && patientProfile.chronic_conditions.length > 0 && (
          <div className="pt-2">
            <p className="text-[10px] font-semibold text-fcn-text-light/50 uppercase tracking-wider mb-1">
              Chronic Conditions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {patientProfile.chronic_conditions.map((c) => (
                <Badge key={c} label={c} variant="teal" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Latest Vitals */}
      <CollapsibleSection
        title="Live Vital Signs"
        icon={<Activity className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-2 gap-2">
          <VitalCard
            icon={<Heart className="h-3.5 w-3.5 text-rose-500" />}
            label="BP"
            value={
              latestVitals.bp_systolic !== null && latestVitals.bp_diastolic !== null
                ? `${latestVitals.bp_systolic}/${latestVitals.bp_diastolic}`
                : null
            }
            unit="mmHg"
          />
          <VitalCard
            icon={<Droplets className="h-3.5 w-3.5 text-sky-500" />}
            label="Glucose"
            value={latestVitals.blood_glucose_mg_dl}
            unit="mg/dL"
          />
          <VitalCard
            icon={<Activity className="h-3.5 w-3.5 text-emerald-500" />}
            label="Heart Rate"
            value={latestVitals.heart_rate_bpm}
            unit="bpm"
          />
          <VitalCard
            icon={<Thermometer className="h-3.5 w-3.5 text-amber-500" />}
            label="Temp"
            value={latestVitals.temperature_celsius}
            unit="°C"
          />
          <VitalCard
            icon={<Shield className="h-3.5 w-3.5 text-indigo-500" />}
            label="SpO₂"
            value={latestVitals.spo2_percent}
            unit="%"
          />
          <VitalCard
            icon={<Weight className="h-3.5 w-3.5 text-purple-500" />}
            label="BMI"
            value={
              patientProfile?.weight_kg && patientProfile?.height_cm
                ? (
                    patientProfile.weight_kg /
                    Math.pow(patientProfile.height_cm / 100, 2)
                  ).toFixed(1)
                : null
            }
            unit="kg/m²"
          />
        </div>
        {latestVitals.recorded_at ? (
          <p className="mt-2.5 text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            <Clock className="mr-1 inline h-3 w-3" />
            Recorded {formatDistanceToNow(new Date(latestVitals.recorded_at))} ago
          </p>
        ) : (
          <p className="mt-2.5 text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40">
            No vitals logged yet
          </p>
        )}
      </CollapsibleSection>

      {/* Active Prescriptions */}
      <CollapsibleSection
        title="Active Prescriptions"
        icon={<Pill className="h-4 w-4" />}
        defaultOpen={false}
      >
        {activePrescriptions.length > 0 ? (
          <div className="space-y-2">
            {activePrescriptions.slice(0, 5).map((rx) => (
              <div key={rx.id} className="rounded-xl border border-fcn-primary/10 bg-fcn-surface-light dark:bg-fcn-dark p-2.5">
                <p className="text-xs font-bold text-fcn-primary">{rx.rx_reference}</p>
                {rx.medications?.map((med) => (
                  <p key={med.id} className="text-xs text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                    {med.drug_name} • {med.strength}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">No active medications</p>
        )}
      </CollapsibleSection>

      {/* Appointment History */}
      <CollapsibleSection
        title="Consultation History"
        icon={<Calendar className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="flex items-center gap-2 rounded-xl border border-fcn-primary/10 bg-fcn-surface-light dark:bg-fcn-dark px-3.5 py-2.5 text-xs text-fcn-text-light/80 dark:text-fcn-text-dark/80">
          <User className="h-4 w-4 text-fcn-primary" />
          <span>
            <strong>{appointmentHistory.total}</strong> total consultations ({appointmentHistory.completed} completed)
          </span>
        </div>
      </CollapsibleSection>
    </div>
  );
}

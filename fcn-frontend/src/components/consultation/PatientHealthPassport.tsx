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
  Clock
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
    <div className="mb-2 overflow-hidden rounded-lg border border-gray-800">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 bg-gray-800/50 px-3 py-2.5 text-left transition-colors hover:bg-gray-800"
      >
        {icon}
        <span className="flex-1 text-sm font-medium text-gray-200">{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-gray-500" />
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
            <div className="px-3 py-2">{children}</div>
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
    normal: "border-gray-700",
    warning: "border-yellow-500/50",
    critical: "border-red-500/50"
  };

  return (
    <div
      className={clsx(
        "rounded-lg border bg-gray-800/30 p-2.5",
        status ? statusColors[status] : "border-gray-700"
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-teal-400">{icon}</span>
        <span className="text-[10px] text-gray-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-base font-semibold text-gray-100">
          {value !== null && value !== undefined ? value : "—"}
        </span>
        {unit && <span className="text-[10px] text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}

function Badge({ label, variant = "teal" }: { label: string; variant?: "teal" | "red" | "green" }) {
  const variants = {
    teal: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    red: "bg-red-500/10 text-red-400 border-red-500/30",
    green: "bg-green-500/10 text-green-400 border-green-500/30"
  };

  return (
    <span className={clsx("inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium", variants[variant])}>
      {variant === "red" && <AlertTriangle className="mr-1 inline h-3 w-3" />}
      {label}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded bg-gray-800", className)} />;
}

export function PatientHealthPassport({ context, isLoading }: HealthPassportProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
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
      <div className="p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/20 text-lg font-bold text-teal-400">
            {context.appointment.doctor.full_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-100">{context.appointment.doctor.full_name}</h3>
            <p className="text-xs text-gray-400">
              {context.appointment.doctor.specialty ?? "Doctor"}
            </p>
            {context.appointment.doctor.bio && (
              <p className="mt-1 text-xs text-gray-500">{context.appointment.doctor.bio}</p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-3">
          <p className="text-xs text-gray-400">
            Appointment: {format(new Date(context.appointment.scheduled_at), "MMM d, yyyy hh:mm a")}
          </p>
          {context.appointment.chief_complaint && (
            <p className="mt-1 text-xs text-gray-500">
              Reason: {context.appointment.chief_complaint}
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
    <div className="h-full overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/20 text-lg font-bold text-teal-400">
          {patient.full_name.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold text-gray-100">{patient.full_name}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {age !== null && <span>{age} years</span>}
            {patientProfile?.blood_type && (
              <Badge label={patientProfile.blood_type} variant="teal" />
            )}
          </div>
        </div>
      </div>

      {patientProfile?.emergency_contact_name && (
        <div className="mb-3 rounded-lg border border-gray-800 bg-gray-800/30 px-3 py-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Phone className="h-3 w-3" />
            <span>Emergency: {patientProfile.emergency_contact_name}</span>
            {patientProfile.emergency_contact_phone && (
              <span className="ml-1">({patientProfile.emergency_contact_phone})</span>
            )}
          </div>
        </div>
      )}

      <div className="mb-3">
        <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">
          Critical Flags
        </h4>
        {patientProfile?.known_allergies ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {patientProfile.known_allergies.split(",").map((a) => (
              <Badge key={a.trim()} label={`⚠ ${a.trim()}`} variant="red" />
            ))}
          </div>
        ) : (
          <p className="mb-2 text-xs text-green-400/70">No known allergies</p>
        )}
        {patientProfile?.chronic_conditions && patientProfile.chronic_conditions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {patientProfile.chronic_conditions.map((c) => (
              <Badge key={c} label={c} variant="teal" />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-600">No chronic conditions recorded</p>
        )}
      </div>

      <CollapsibleSection
        title="Latest Vitals"
        icon={<Activity className="h-4 w-4 text-teal-400" />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-2 gap-2">
          <VitalCard
            icon={<Heart className="h-3.5 w-3.5" />}
            label="Blood Pressure"
            value={
              latestVitals.bp_systolic !== null && latestVitals.bp_diastolic !== null
                ? `${latestVitals.bp_systolic}/${latestVitals.bp_diastolic}`
                : null
            }
            unit="mmHg"
          />
          <VitalCard
            icon={<Droplets className="h-3.5 w-3.5" />}
            label="Blood Glucose"
            value={latestVitals.blood_glucose_mg_dl}
            unit="mg/dL"
          />
          <VitalCard
            icon={<Activity className="h-3.5 w-3.5" />}
            label="Heart Rate"
            value={latestVitals.heart_rate_bpm}
            unit="bpm"
          />
          <VitalCard
            icon={<Thermometer className="h-3.5 w-3.5" />}
            label="Temperature"
            value={latestVitals.temperature_celsius}
            unit="°C"
          />
          <VitalCard
            icon={<Shield className="h-3.5 w-3.5" />}
            label="SpO₂"
            value={latestVitals.spo2_percent}
            unit="%"
          />
          <VitalCard
            icon={<Weight className="h-3.5 w-3.5" />}
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
        {latestVitals.recorded_at && (
          <p className="mt-2 text-[10px] text-gray-600">
            <Clock className="mr-1 inline h-3 w-3" />
            Recorded {formatDistanceToNow(new Date(latestVitals.recorded_at))} ago
          </p>
        )}
        {!latestVitals.recorded_at && (
          <p className="mt-2 text-[10px] text-gray-600">
            No vitals recorded yet — Patient hasn&apos;t logged measurements
          </p>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Active Prescriptions"
        icon={<Pill className="h-4 w-4 text-teal-400" />}
        defaultOpen={false}
      >
        {activePrescriptions.length > 0 ? (
          <div className="space-y-2">
            {activePrescriptions.slice(0, 5).map((rx) => (
              <div key={rx.id} className="rounded border border-gray-700 bg-gray-800/30 p-2">
                <p className="text-xs font-medium text-gray-200">{rx.rx_reference}</p>
                {rx.medications?.map((med) => (
                  <p key={med.id} className="text-xs text-gray-400">
                    {med.drug_name} {med.strength}
                  </p>
                ))}
              </div>
            ))}
            <a
              href="/pharmacy"
              className="inline-block text-xs text-teal-400 hover:text-teal-300"
            >
              View All in Pharmacy →
            </a>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No active prescriptions</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Appointment History"
        icon={<Calendar className="h-4 w-4 text-teal-400" />}
        defaultOpen={false}
      >
        <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/30 px-3 py-2">
          <User className="h-4 w-4 text-teal-400" />
          <span className="text-xs text-gray-300">
            {appointmentHistory.total} consultations on FCN
          </span>
          <span className="text-xs text-gray-500">
            ({appointmentHistory.completed} completed)
          </span>
        </div>
      </CollapsibleSection>
    </div>
  );
}

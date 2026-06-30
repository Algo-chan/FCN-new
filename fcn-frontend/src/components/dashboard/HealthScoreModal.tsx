import { Activity, Heart, Thermometer, Droplets, Wind, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { PatientVital } from "@/types";

interface HealthScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  vitals: PatientVital | null;
}

const StatusIcon = ({ status }: { status: "good" | "fair" | "needs_attention" }) => {
  if (status === "good") {
    return <TrendingUp className="h-5 w-5 text-fcn-success" />;
  }
  if (status === "fair") {
    return <Minus className="h-5 w-5 text-fcn-warning" />;
  }
  return <TrendingDown className="h-5 w-5 text-fcn-danger" />;
};

const getScoreStatus = (score: number): { label: string; color: string; status: "good" | "fair" | "needs_attention" } => {
  if (score >= 80) {
    return { label: "Good", color: "text-fcn-success", status: "good" };
  }
  if (score >= 50) {
    return { label: "Fair", color: "text-fcn-warning", status: "fair" };
  }
  return { label: "Needs Attention", color: "text-fcn-danger", status: "needs_attention" };
};

const vitalChecks: {
  label: string;
  icon: React.ReactNode;
  getValue: (v: PatientVital) => string;
  getStatus: (v: PatientVital) => "good" | "fair" | "needs_attention";
}[] = [
  {
    label: "Blood Pressure",
    icon: <Activity className="h-4 w-4" />,
    getValue: (v) => `${v.bp_systolic ?? "—"}/${v.bp_diastolic ?? "—"} mmHg`,
    getStatus: (v) => {
      if (!v.bp_systolic || !v.bp_diastolic) {
        return "fair";
      }
      if ((v.bp_systolic >= 120 && v.bp_systolic <= 130) || (v.bp_diastolic >= 80 && v.bp_diastolic <= 85)) {
        return "fair";
      }
      if (v.bp_systolic > 140 || v.bp_diastolic > 90 || v.bp_systolic < 90 || v.bp_diastolic < 60) {
        return "needs_attention";
      }
      return "good";
    }
  },
  {
    label: "Heart Rate",
    icon: <Heart className="h-4 w-4" />,
    getValue: (v) => `${v.heart_rate_bpm ?? "—"} bpm`,
    getStatus: (v) => {
      if (!v.heart_rate_bpm) {
        return "fair";
      }
      if (v.heart_rate_bpm > 100 || v.heart_rate_bpm < 60) {
        return "needs_attention";
      }
      return "good";
    }
  },
  {
    label: "Temperature",
    icon: <Thermometer className="h-4 w-4" />,
    getValue: (v) => `${v.temperature_celsius ?? "—"} °C`,
    getStatus: (v) => {
      if (!v.temperature_celsius) {
        return "fair";
      }
      const temp = Number(v.temperature_celsius);
      if (temp > 38 || temp < 36) {
        return "needs_attention";
      }
      return "good";
    }
  },
  {
    label: "Blood Glucose",
    icon: <Droplets className="h-4 w-4" />,
    getValue: (v) => `${v.blood_glucose_mg_dl ?? "—"} mg/dL`,
    getStatus: (v) => {
      if (!v.blood_glucose_mg_dl) {
        return "fair";
      }
      const glucose = Number(v.blood_glucose_mg_dl);
      if (glucose > 140 || glucose < 70) {
        return "needs_attention";
      }
      return "good";
    }
  },
  {
    label: "SpO2",
    icon: <Wind className="h-4 w-4" />,
    getValue: (v) => `${v.spo2_percent ?? "—"}%`,
    getStatus: (v) => {
      if (!v.spo2_percent) {
        return "fair";
      }
      const spo2 = Number(v.spo2_percent);
      if (spo2 < 95) {
        return "needs_attention";
      }
      return "good";
    }
  }
];

const statusColors = {
  good: "bg-fcn-success/10 text-fcn-success border-fcn-success/20",
  fair: "bg-fcn-warning/10 text-fcn-warning border-fcn-warning/20",
  needs_attention: "bg-fcn-danger/10 text-fcn-danger border-fcn-danger/20"
} as const;

export const HealthScoreModal = ({ isOpen, onClose, score, vitals }: HealthScoreModalProps) => {
  const { label, color, status } = getScoreStatus(score);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Health Score Overview" size="lg">
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-lg bg-fcn-primary/5 p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-fcn-primary/10">
            <Activity className="h-8 w-8 text-fcn-primary" />
          </div>
          <div>
            <p className="text-sm text-fcn-text-light/65 dark:text-fcn-text-dark/65">
              Overall Health Score
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                {score}
              </span>
              <span className="text-lg">/ 100</span>
            </div>
            <div className={`mt-1 inline-flex items-center gap-1 text-sm font-medium ${color}`}>
              <StatusIcon status={status} />
              {label}
            </div>
          </div>
        </div>

        {vitals ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {vitalChecks.map((check) => {
              const vitalStatus = check.getStatus(vitals);
              return (
                <div
                  key={check.label}
                  className={`flex items-center justify-between rounded-lg border p-3 ${statusColors[vitalStatus]}`}
                >
                  <div className="flex items-center gap-2">
                    {check.icon}
                    <span className="text-sm font-medium">{check.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{check.getValue(vitals)}</span>
                    <StatusIcon status={vitalStatus} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            No vital records available. Record your vitals to see a detailed breakdown.
          </p>
        )}

        <p className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
          Scores are calculated based on your latest recorded vitals. Ranges follow WHO clinical guidelines.
        </p>
      </div>
    </Modal>
  );
};

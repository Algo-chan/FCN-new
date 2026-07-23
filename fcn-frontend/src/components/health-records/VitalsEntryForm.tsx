import { useState, useMemo, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart, Droplets, Thermometer, Wind, Weight, Activity,
  Save, AlertTriangle, Ruler
} from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { SpO2Alert } from "@/components/health-records/SpO2Alert";
import {
  classifyBP, classifyGlucose, classifyHeartRate,
  classifyTemperature, classifySpo2, classifyBMI
} from "@/utils/vitals-classifier";

interface VitalsEntryFormProps {
  onSubmit: (data: VitalsEntryData) => Promise<void>;
  isSubmitting: boolean;
}

export interface VitalsEntryData {
  bp_systolic?: number;
  bp_diastolic?: number;
  blood_glucose_mg_dl?: number;
  heart_rate_bpm?: number;
  temperature_celsius?: number;
  spo2_percent?: number;
  weight_kg?: number;
  height_cm?: number;
  notes?: string;
}

interface SectionState {
  systolic: string;
  diastolic: string;
  glucose: string;
  heartRate: string;
  temperature: string;
  spo2: string;
  weight: string;
  height: string;
  notes: string;
}

const emptySection: SectionState = {
  systolic: "",
  diastolic: "",
  glucose: "",
  heartRate: "",
  temperature: "",
  spo2: "",
  weight: "",
  height: "",
  notes: ""
};

const inputClass = "h-10 w-full rounded-lg border border-fcn-primary/15 bg-white px-3 text-sm text-fcn-text-light outline-none transition placeholder:text-fcn-text-light/40 focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/25 dark:bg-fcn-dark dark:text-fcn-text-dark dark:placeholder:text-fcn-text-dark/40";

export const VitalsEntryForm = ({ onSubmit, isSubmitting }: VitalsEntryFormProps) => {
  const [values, setValues] = useState<SectionState>(emptySection);

  const update = (field: keyof SectionState, val: string) =>
    setValues((prev) => ({ ...prev, [field]: val }));

  const num = (v: string) => (v === "" ? undefined : Number(v));

  const classifications = useMemo(() => {
    const s = num(values.systolic);
    const d = num(values.diastolic);
    const g = num(values.glucose);
    const hr = num(values.heartRate);
    const t = num(values.temperature);
    const sp = num(values.spo2);
    const w = num(values.weight);
    const h = num(values.height);
    const bmi = w != null && h != null && h > 0 ? w / ((h / 100) * (h / 100)) : null;

    return {
      bp: s != null || d != null ? classifyBP(s ?? 120, d ?? 80) : null,
      glucose: g != null ? classifyGlucose(g) : null,
      heartRate: hr != null ? classifyHeartRate(hr) : null,
      temperature: t != null ? classifyTemperature(t) : null,
      spo2: sp != null ? classifySpo2(sp) : null,
      bmi: bmi != null ? classifyBMI(bmi) : null,
      calculatedBmi: bmi
    };
  }, [values]);

  const showSpO2Alert = classifications.spo2?.status === "critical";

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      bp_systolic: num(values.systolic),
      bp_diastolic: num(values.diastolic),
      blood_glucose_mg_dl: num(values.glucose),
      heart_rate_bpm: num(values.heartRate),
      temperature_celsius: num(values.temperature),
      spo2_percent: num(values.spo2),
      weight_kg: num(values.weight),
      height_cm: num(values.height),
      notes: values.notes || undefined
    });
  };

  const hasAny = Object.values(values).some((v) => v !== "");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* BP Section */}
      <VitalSection
        icon={<Heart className="h-4 w-4" />}
        title="Blood Pressure"
        classification={classifications.bp}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70">Systolic (mmHg)</label>
            <input
              type="number" min={60} max={250} step={1}
              value={values.systolic}
              onChange={(e) => update("systolic", e.target.value)}
              placeholder="120"
              className={inputClass}
              aria-label="Systolic blood pressure"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70">Diastolic (mmHg)</label>
            <input
              type="number" min={30} max={150} step={1}
              value={values.diastolic}
              onChange={(e) => update("diastolic", e.target.value)}
              placeholder="80"
              className={inputClass}
              aria-label="Diastolic blood pressure"
            />
          </div>
        </div>
      </VitalSection>

      {/* Glucose Section */}
      <VitalSection
        icon={<Droplets className="h-4 w-4" />}
        title="Blood Glucose"
        classification={classifications.glucose}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70">Glucose (mg/dL)</label>
          <input
            type="number" min={20} max={500} step={1}
            value={values.glucose}
            onChange={(e) => update("glucose", e.target.value)}
            placeholder="95"
            className={inputClass}
            aria-label="Blood glucose level"
          />
        </div>
      </VitalSection>

      {/* Heart Rate Section */}
      <VitalSection
        icon={<Activity className="h-4 w-4" />}
        title="Heart Rate"
        classification={classifications.heartRate}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70">Heart Rate (bpm)</label>
          <input
            type="number" min={30} max={220} step={1}
            value={values.heartRate}
            onChange={(e) => update("heartRate", e.target.value)}
            placeholder="72"
            className={inputClass}
            aria-label="Heart rate"
          />
        </div>
      </VitalSection>

      {/* Temperature Section */}
      <VitalSection
        icon={<Thermometer className="h-4 w-4" />}
        title="Temperature"
        classification={classifications.temperature}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70">Temperature (°C)</label>
          <input
            type="number" min={34} max={42} step={0.1}
            value={values.temperature}
            onChange={(e) => update("temperature", e.target.value)}
            placeholder="36.6"
            className={inputClass}
            aria-label="Body temperature"
          />
        </div>
      </VitalSection>

      {/* SpO2 Section */}
      <VitalSection
        icon={<Wind className="h-4 w-4" />}
        title="Oxygen Saturation (SpO2)"
        classification={classifications.spo2}
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70">SpO2 (%)</label>
          <input
            type="number" min={50} max={100} step={1}
            value={values.spo2}
            onChange={(e) => update("spo2", e.target.value)}
            placeholder="98"
            className={inputClass}
            aria-label="Oxygen saturation"
          />
        </div>
        <AnimatePresence>
          {showSpO2Alert && <SpO2Alert value={Number(values.spo2)} context="form" />}
        </AnimatePresence>
      </VitalSection>

      {/* Weight & Height Section */}
      <VitalSection
        icon={<Weight className="h-4 w-4" />}
        title="Weight & Height"
        classification={classifications.bmi}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70">Weight (kg)</label>
            <input
              type="number" min={1} max={400} step={0.1}
              value={values.weight}
              onChange={(e) => update("weight", e.target.value)}
              placeholder="70"
              className={inputClass}
              aria-label="Weight"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70">Height (cm)</label>
            <input
              type="number" min={50} max={250} step={1}
              value={values.height}
              onChange={(e) => update("height", e.target.value)}
              placeholder="170"
              className={inputClass}
              aria-label="Height"
            />
          </div>
        </div>
        {classifications.calculatedBmi != null && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <Ruler className="h-3.5 w-3.5 text-fcn-primary" />
            <span className="text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              BMI: <strong>{classifications.calculatedBmi.toFixed(1)}</strong> kg/m²
            </span>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${classifications.bmi?.color ?? "#94A3B8"}20`,
                color: classifications.bmi?.color ?? "#94A3B8"
              }}
            >
              {classifications.bmi?.label ?? "—"}
            </span>
          </div>
        )}
      </VitalSection>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-xs font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70">Notes (optional)</label>
        <textarea
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          className={clsx(inputClass, "h-auto resize-none py-2")}
          placeholder="Any additional notes..."
          aria-label="Vital notes"
        />
      </div>

      {/* Submit */}
      <motion.div
        initial={false}
        animate={showSpO2Alert ? { borderColor: "#F87171" } : {}}
        className="rounded-xl border border-fcn-primary/10 bg-white p-4 dark:bg-fcn-dark"
      >
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!hasAny}
          className="w-full"
          size="lg"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Record Vitals"}
        </Button>
        {showSpO2Alert && (
          <p className="mt-2 text-center text-[10px] text-red-500">
            Critically low SpO2 — please seek medical attention after recording.
          </p>
        )}
      </motion.div>
    </form>
  );
};

// -- Sub-components --

function VitalSection({
  icon, title, classification, children
}: {
  icon: React.ReactNode;
  title: string;
  classification: { status: string; label: string; color: string } | null;
  children: React.ReactNode;
}) {
  const borderColor = classification
    ? classification.status === "critical"
      ? "border-red-500/30"
      : classification.status === "warning"
        ? "border-amber-500/30"
        : "border-emerald-500/30"
    : "border-fcn-primary/10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx("rounded-xl border bg-white p-4 dark:bg-fcn-dark", borderColor)}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-fcn-accent">{icon}</span>
          <span className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">{title}</span>
        </div>
        {classification && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${classification.color}20`,
              color: classification.color
            }}
          >
            {classification.label}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}

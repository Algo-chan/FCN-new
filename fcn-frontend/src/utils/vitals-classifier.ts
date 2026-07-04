export type VitalStatus = "normal" | "warning" | "critical";

export interface VitalClassification {
  status: VitalStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const normal: VitalClassification = { status: "normal", label: "Normal", color: "#10B981", bgColor: "bg-emerald-50 dark:bg-emerald-950/20", borderColor: "border-emerald-500" };
const warning = (label: string): VitalClassification => ({ status: "warning", label: `Warning: ${label}`, color: "#FBBF24", bgColor: "bg-amber-50 dark:bg-amber-950/20", borderColor: "border-amber-500" });
const critical = (label: string): VitalClassification => ({ status: "critical", label: `Critical: ${label}`, color: "#F87171", bgColor: "bg-red-50 dark:bg-red-950/20", borderColor: "border-red-500" });

export function classifyBP(systolic: number, diastolic: number): VitalClassification {
  if (systolic < 90 || systolic >= 160 || diastolic < 60 || diastolic >= 100) {
    if (systolic >= 160) return critical("High Systolic");
    if (systolic < 90) return critical("Low Systolic");
    if (diastolic >= 100) return critical("High Diastolic");
    if (diastolic < 60) return critical("Low Diastolic");
  }
  if (systolic >= 140 || diastolic >= 90) {
    if (systolic >= 140) return warning("Elevated Systolic");
    return warning("Elevated Diastolic");
  }
  return normal;
}

export function classifyGlucose(value: number): VitalClassification {
  if (value < 70) return critical("Low Glucose");
  if (value > 180) return critical("High Glucose");
  if (value > 125) return warning("Elevated Glucose");
  return normal;
}

export function classifyHeartRate(value: number): VitalClassification {
  if (value > 150) return critical("Very High Heart Rate");
  if (value > 100) return warning("Elevated Heart Rate");
  if (value < 60) return warning("Low Heart Rate");
  return normal;
}

export function classifyTemperature(value: number): VitalClassification {
  if (value >= 38.5) return critical("High Fever");
  if (value >= 37.6) return warning("Fever");
  if (value < 36.1) return warning("Low Temperature");
  return normal;
}

export function classifySpo2(value: number): VitalClassification {
  if (value < 95) return critical("Low Oxygen");
  return normal;
}

export function classifyBMI(bmi: number): VitalClassification {
  if (bmi >= 30) return critical("Obese");
  if (bmi >= 25) return warning("Overweight");
  if (bmi < 18.5) return warning("Underweight");
  return normal;
}

export function classifyVital(
  type: "bp" | "glucose" | "heart_rate" | "temperature" | "spo2" | "bmi",
  value: number,
  value2?: number
): VitalClassification {
  switch (type) {
    case "bp": return classifyBP(value, value2 ?? 0);
    case "glucose": return classifyGlucose(value);
    case "heart_rate": return classifyHeartRate(value);
    case "temperature": return classifyTemperature(value);
    case "spo2": return classifySpo2(value);
    case "bmi": return classifyBMI(value);
  }
}

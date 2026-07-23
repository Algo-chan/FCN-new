import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Cell,
  CartesianGrid
} from "recharts";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { classifyBP, classifyGlucose, classifyTemperature } from "@/utils/vitals-classifier";

interface TrendDataPoint {
  date: string;
  systolic?: number | null;
  diastolic?: number | null;
  value?: number | null;
}

interface VitalsChartProps {
  type: "bp" | "glucose" | "temperature" | "weight";
  data: TrendDataPoint[];
  title: string;
  unit: string;
  isLoading: boolean;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/20 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-md dark:bg-fcn-dark/90">
      <p className="mb-1 text-xs font-medium text-fcn-text-light dark:text-fcn-text-dark">{label}</p>
      {payload.map((entry: any, i: number) => {
        const cls = classifyVitalForTooltip(entry);
        return (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value} {entry.unit ?? ""}
            {cls && <span className="ml-1 opacity-70">({cls})</span>}
          </p>
        );
      })}
    </div>
  );
};

function classifyVitalForTooltip(entry: any): string | null {
  if (entry.name === "Systolic") {
    const cls = classifyBP(entry.value, 0);
    return cls.status === "normal" ? "✅" : cls.status === "warning" ? "⚠" : "🚨";
  }
  if (entry.name === "Diastolic") {
    const cls = classifyBP(0, entry.value);
    return cls.status === "normal" ? "✅" : cls.status === "warning" ? "⚠" : "🚨";
  }
  if (entry.dataKey === "value" && entry.payload.value) {
    if (entry.name === "Glucose") {
      const cls = classifyGlucose(entry.value);
      return cls.label;
    }
    if (entry.name === "Temperature") {
      const cls = classifyTemperature(entry.value);
      return cls.label;
    }
  }
  return null;
}

const EmptyChartState = ({ vitalName }: { vitalName: string }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
    <TrendingUp className="h-8 w-8 text-fcn-text-light/20 dark:text-fcn-text-dark/20" />
    <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">No readings this week</p>
    <p className="text-xs text-fcn-text-light/30 dark:text-fcn-text-dark/30">
      Record your {vitalName} to see your trend
    </p>
  </div>
);

export const VitalsChart = ({ type, data, title, unit, isLoading, height = 220 }: VitalsChartProps) => {
  const hasData = useMemo(() => data.some((d) => {
    if (type === "bp") return d.systolic != null || d.diastolic != null;
    return d.value != null;
  }), [data, type]);

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-fcn-primary/10 bg-white p-4 dark:bg-fcn-dark">
        <div className="mb-4 h-5 w-32 rounded bg-fcn-primary/10" />
        <div className="h-[180px] rounded bg-fcn-primary/5" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-fcn-primary/10 bg-white p-4 dark:bg-fcn-dark"
    >
      {type === "weight" && data.length >= 2 && hasData && (
        <WeightTrendIndicator data={data} />
      )}

      <h4 className="mb-4 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">{title}</h4>

      {!hasData ? (
        <div style={{ height }}>
          <EmptyChartState vitalName={title.toLowerCase()} />
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === "bp" ? (
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis domain={[40, 200]} tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceArea y1={90} y2={139} fill="#10B981" fillOpacity={0.06} />
                <ReferenceLine y={140} stroke="#FBBF24" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Hypertension", position: "right", fontSize: 9 }} />
                <Line type="monotone" dataKey="systolic" stroke="#F87171" strokeWidth={2} dot={{ r: 3 }} name="Systolic" animationDuration={1200} />
                <Line type="monotone" dataKey="diastolic" stroke="#0A7EA4" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" animationDuration={1200} />
              </ComposedChart>
            ) : type === "glucose" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis domain={[0, 250]} tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={125} stroke="#FBBF24" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Elevated", position: "right", fontSize: 9 }} />
                <ReferenceLine y={70} stroke="#F87171" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Low", position: "right", fontSize: 9 }} />
                <Bar dataKey="value" name="Glucose" radius={[4, 4, 0, 0]} animationDuration={1200}>
                  {data.map((entry, i) => {
                    let fill = "#10B981";
                    if (entry.value != null) {
                      if (entry.value > 180) fill = "#F87171";
                      else if (entry.value > 125) fill = "#FBBF24";
                      else if (entry.value < 70) fill = "#F87171";
                    }
                    return <Cell key={i} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            ) : type === "temperature" ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis domain={[35, 40]} tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <ReferenceLine y={37.5} stroke="#FBBF24" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Fever", position: "right", fontSize: 9 }} />
                <ReferenceLine y={38.5} stroke="#F87171" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "High Fever", position: "right", fontSize: 9 }} />
                <Bar dataKey="value" name="Temperature" radius={[4, 4, 0, 0]} animationDuration={1200}>
                  {data.map((entry, i) => {
                    let fill = "#10B981";
                    if (entry.value != null) {
                      if (entry.value >= 38.5) fill = "#F87171";
                      else if (entry.value >= 37.6) fill = "#FBBF24";
                      else if (entry.value < 36.1) fill = "#60A5FA";
                    }
                    return <Cell key={i} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            ) : (
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="value" stroke="#0A7EA4" strokeWidth={2} dot={{ r: 3 }} name="Weight" animationDuration={1200} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
};

function WeightTrendIndicator({ data }: { data: TrendDataPoint[] }) {
  const first = data.find((d) => d.value != null);
  const last = data.slice().reverse().find((d) => d.value != null);
  if (!first?.value || !last?.value) return null;
  const diff = last.value - first.value;
  const sign = diff > 0 ? "+" : "";
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const color = Math.abs(diff) > 1 ? "text-amber-500" : "text-emerald-500";
  return (
    <div className={clsx("mb-2 flex items-center gap-1 text-xs font-medium", color)}>
      <Icon className="h-3.5 w-3.5" />
      {sign}{diff.toFixed(1)}kg this week
    </div>
  );
}

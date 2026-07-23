import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { motion } from "motion/react";
import { clsx } from "clsx";
import type { TrendPoint } from "@/services/admin.service";
import { Card } from "@/components/ui/Card";

interface Props {
  data: TrendPoint[];
  loading?: boolean;
  onDaysChange?: (days: number) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.find((p: any) => p.name === "total")?.value ?? 0;
  const completed = payload.find((p: any) => p.name === "completed")?.value ?? 0;
  const cancelled = payload.find((p: any) => p.name === "cancelled")?.value ?? 0;

  return (
    <div className="rounded-lg border border-fcn-primary/20 bg-white p-3 shadow-lg dark:bg-fcn-dark">
      <p className="mb-1 text-xs font-semibold text-fcn-text-light dark:text-fcn-text-dark">{label}</p>
      <div className="space-y-0.5 text-xs">
        <p className="text-fcn-accent">Total: {total} consultations</p>
        <p className="text-fcn-success">Completed: {completed} &#x2705;</p>
        <p className="text-fcn-danger">Cancelled: {cancelled} &#x274C;</p>
      </div>
    </div>
  );
};

const rangeOptions = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export const ConsultationsTrendChart = ({ data, loading, onDaysChange }: Props) => {
  const [activeRange, setActiveRange] = useState(30);

  const handleRangeChange = (days: number) => {
    setActiveRange(days);
    onDaysChange?.(days);
  };

  const average = data.length > 0
    ? Math.round(data.reduce((sum, d) => sum + d.total, 0) / data.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
            Consultations Trend
          </h3>
          <div className="flex gap-1 rounded-lg bg-fcn-primary/5 p-0.5">
            {rangeOptions.map((opt) => (
              <button
                key={opt.days}
                onClick={() => handleRangeChange(opt.days)}
                className={clsx(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  activeRange === opt.days
                    ? "bg-fcn-accent text-white"
                    : "text-fcn-text-light/60 hover:text-fcn-text-light dark:text-fcn-text-dark/60"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-[300px] animate-pulse rounded-lg bg-fcn-primary/5" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,126,164,0.08)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "rgba(100,116,139,0.6)" }}
                  interval={Math.max(0, Math.floor(data.length / 5) - 1)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgba(100,116,139,0.6)" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={average}
                  stroke="#2DD4BF"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                  label={{
                    value: `Avg ${average}`,
                    position: "right",
                    fill: "rgba(100,116,139,0.5)",
                    fontSize: 11,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#2DD4BF"
                  strokeWidth={2}
                  fill="url(#totalGrad)"
                  animationDuration={1000}
                  name="total"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#completedGrad)"
                  animationDuration={1000}
                  name="completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

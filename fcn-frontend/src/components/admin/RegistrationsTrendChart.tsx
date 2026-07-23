import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "motion/react";
import type { RegistrationTrendPoint } from "@/services/admin.service";
import { Card } from "@/components/ui/Card";

interface Props {
  data: RegistrationTrendPoint[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-fcn-primary/20 bg-white p-3 shadow-lg dark:bg-fcn-dark">
      <p className="mb-1 text-xs font-semibold text-fcn-text-light dark:text-fcn-text-dark">{label}</p>
      <div className="space-y-0.5 text-xs">
        <p style={{ color: "#2DD4BF" }}>Patients: {payload.find((p: any) => p.name === "patients")?.value ?? 0}</p>
        <p style={{ color: "#10B981" }}>Doctors: {payload.find((p: any) => p.name === "doctors")?.value ?? 0}</p>
        <p style={{ color: "#FBBF24" }}>Nurses: {payload.find((p: any) => p.name === "nurses")?.value ?? 0}</p>
        <p className="mt-1 font-medium text-fcn-text-light dark:text-fcn-text-dark">
          Total: {payload.find((p: any) => p.name === "total")?.value ?? 0}
        </p>
      </div>
    </div>
  );
};

export const RegistrationsTrendChart = ({ data, loading }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
          Registrations (Weekly)
        </h3>
        {loading ? (
          <div className="h-[300px] animate-pulse rounded-lg bg-fcn-primary/5" />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(10,126,164,0.08)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: "rgba(100,116,139,0.6)" }}
                  interval={Math.max(0, Math.floor(data.length / 4) - 1)}
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
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="patients"
                  name="Patients"
                  stackId="a"
                  fill="#2DD4BF"
                  animationDuration={1000}
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="doctors"
                  name="Doctors"
                  stackId="a"
                  fill="#10B981"
                  animationDuration={1000}
                  radius={[2, 2, 0, 0]}
                />
                <Bar
                  dataKey="nurses"
                  name="Nurses"
                  stackId="a"
                  fill="#FBBF24"
                  animationDuration={1000}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { gsap } from "gsap";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Lock } from "lucide-react";
import { getEarningsSummary } from "@/services/doctor-dashboard.service";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

export const EarningsSummaryPanel = () => {
  const { data: res, isLoading } = useQuery({
    queryKey: ["earnings-summary"],
    queryFn: () => getEarningsSummary(),
  });

  const countersRef = useRef<HTMLDivElement>(null);
  const data = res?.data;

  useEffect(() => {
    if (!data || !countersRef.current) return;
    const counters = countersRef.current.querySelectorAll("[data-count]");
    counters.forEach((el) => {
      const target = parseInt(el.getAttribute("data-count") ?? "0");
      gsap.fromTo(el, { textContent: 0 }, {
        textContent: target,
        duration: 1.2,
        ease: "power2.out",
        snap: { textContent: 1 },
      });
    });
  }, [data]);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>;
  if (!data) return null;

  const growthColor = data.growth_vs_last_month >= 0 ? "text-fcn-success" : "text-fcn-danger";
  const GrowthIcon = data.growth_vs_last_month >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">Consultation Performance</h3>
        <div className="relative group">
          <Lock className="h-3 w-3 text-fcn-text-light/30 dark:text-fcn-text-dark/30" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-fcn-dark text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Earnings amounts are managed by your hospital administrator
          </div>
        </div>
      </div>

      <div ref={countersRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-[10px] text-fcn-text-light/60 dark:text-fcn-text-dark/60">This Month</p>
          <p className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark mt-1">
            <span data-count={data.this_month_completed}>{data.this_month_completed}</span>
          </p>
          <div className={`flex items-center gap-0.5 text-[10px] mt-1 ${growthColor}`}>
            <GrowthIcon className="h-3 w-3" />
            <span>{Math.abs(data.growth_vs_last_month).toFixed(1)}% vs last month</span>
          </div>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-fcn-text-light/60 dark:text-fcn-text-dark/60">This Week</p>
          <p className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark mt-1">
            <span data-count={data.this_week_completed}>{data.this_week_completed}</span>
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-fcn-text-light/60 dark:text-fcn-text-dark/60">All Time</p>
          <p className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark mt-1">
            <span data-count={data.total_completed}>{data.total_completed}</span>
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-[10px] text-fcn-text-light/60 dark:text-fcn-text-dark/60">Average</p>
          <p className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark mt-1">
            <span data-count={Math.round(data.average_per_week)}>{Math.round(data.average_per_week)}</span><span className="text-sm font-normal text-fcn-text-light/60">/week</span>
          </p>
        </Card>
      </div>

      {data.monthly_trend.length > 0 && (
        <Card className="p-4">
          <p className="text-xs font-semibold text-fcn-text-light dark:text-fcn-text-dark mb-3">Monthly Trend</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly_trend}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="consultations" fill="#0A7EA4" radius={[4, 4, 0, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className={`p-4 ${data.payment_status === "pilot" ? "border-fcn-warning/30 bg-fcn-warning/5" : "border-fcn-success/30 bg-fcn-success/5"}`}>
        {data.payment_status === "pilot" ? (
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <div>
              <p className="text-sm font-medium text-fcn-warning">Free Pilot Period</p>
              <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
                Consultations during this period are free. Your earnings will be calculated automatically when payment activates.
              </p>
              {data.pilot_message && (
                <p className="text-xs text-fcn-warning/70 mt-1">Estimated activation: {data.pilot_message.split(" on ")[1] ?? "TBD"}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div>
              <p className="text-sm font-medium text-fcn-success">Earnings Active</p>
              <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
                Your earnings are being processed. Contact your hospital administrator for payout details.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

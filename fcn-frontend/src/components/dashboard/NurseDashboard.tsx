import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { motion } from "motion/react";
import { Calendar, Users, Activity, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { getNurseStats, getTodayVisits, getUpcomingVisits, getVisitHistory, type TodayVisit, type UpcomingVisit } from "@/services/nurse-dashboard.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TodayVisitCard } from "@/components/nurse-dashboard/TodayVisitCard";

const StatCard = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => (
  <Card className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
    <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-lg md:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">{value}</p>
      <p className="text-[10px] md:text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 truncate">{label}</p>
    </div>
  </Card>
);

export const NurseDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(" ")[0] ?? "Nurse";
  const isRural = user?.role === "rural_health_officer";
  const [historyOpen, setHistoryOpen] = useState(false);

  const visitLabel = isRural ? "case" : "visit";
  const visitLabelPlural = isRural ? "cases" : "visits";

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["nurse-stats"],
    queryFn: () => getNurseStats(),
  });

  const { data: todayRes, isLoading: todayLoading } = useQuery({
    queryKey: ["today-visits"],
    queryFn: () => getTodayVisits(),
  });

  const { data: upcomingRes, isLoading: upcomingLoading } = useQuery({
    queryKey: ["upcoming-visits"],
    queryFn: () => getUpcomingVisits(),
  });

  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ["visit-history"],
    queryFn: () => getVisitHistory(),
    enabled: historyOpen,
  });

  const stats = statsRes?.data;
  const todayVisits: TodayVisit[] = todayRes?.data ?? [];
  const upcomingVisits: UpcomingVisit[] = upcomingRes?.data ?? [];
  const visitHistory: any[] = historyRes?.data ?? [];

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-fcn-primary/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-base md:text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
          {greeting}, {firstName} 🏠
        </h1>
        <p className="text-xs md:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-1">
          {stats?.today_visits ?? 0} {visitLabelPlural} scheduled today
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-3">
          <StatCard
            label={`Today's ${visitLabelPlural}`}
            value={stats.today_visits}
            icon={<Calendar className="h-5 w-5 text-white" />}
            color="bg-fcn-primary"
          />
          <StatCard
            label={`Completed This Week`}
            value={stats.completed_this_week}
            icon={<Activity className="h-5 w-5 text-white" />}
            color="bg-fcn-accent"
          />
          <StatCard
            label="Total Patients Served"
            value={stats.patients_served}
            icon={<Users className="h-5 w-5 text-white" />}
            color="bg-fcn-warning"
          />
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark mb-3">Today's Schedule</h2>
        {todayLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-fcn-primary/5" />
            ))}
          </div>
        ) : todayVisits.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              No {visitLabelPlural} scheduled today
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {todayVisits.map((v, i) => (
              <TodayVisitCard key={v.id} visit={v} index={i} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark mb-3">
          Upcoming {visitLabelPlural}
        </h2>
        {upcomingLoading ? (
          <div className="h-32 animate-pulse rounded-xl bg-fcn-primary/5" />
        ) : upcomingVisits.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">No upcoming {visitLabelPlural}</p>
          </Card>
        ) : (
          <Card className="divide-y divide-fcn-primary/10">
            {upcomingVisits.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">{v.patient_name}</p>
                  <p className="text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                    {format(parseISO(v.scheduled_at), "MMM d, h:mm a")}
                    {v.home_address && ` · ${v.home_address}`}
                  </p>
                </div>
                <Button size="sm" variant="secondary">Prepare</Button>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section>
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark"
        >
          {historyOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Past {visitLabelPlural}
        </button>

        {historyOpen && (
          historyLoading ? (
            <div className="h-24 animate-pulse rounded-xl bg-fcn-primary/5 mt-3" />
          ) : visitHistory.length === 0 ? (
            <Card className="p-4 text-center mt-3">
              <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">No past {visitLabelPlural}</p>
            </Card>
          ) : (
            <Card className="mt-3 divide-y divide-fcn-primary/10">
              {visitHistory.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">{v.patient_name}</p>
                    <p className="text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                      {format(parseISO(v.scheduled_at), "MMM d, yyyy")} · {v.appointment_type}
                    </p>
                  </div>
                  <Badge variant="success" size="sm">Completed</Badge>
                </div>
              ))}
              <div className="p-3 text-center">
                <a href="/nurse/patients" className="text-xs text-fcn-primary hover:underline">View All →</a>
              </div>
            </Card>
          )
        )}
      </section>
    </div>
  );
};

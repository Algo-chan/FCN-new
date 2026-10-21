import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { motion } from "framer-motion";
import { Calendar, Users, Activity, Clock, ChevronDown, ChevronRight, HeartHandshake, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { getNurseStats, getTodayVisits, getUpcomingVisits, getVisitHistory, type TodayVisit, type UpcomingVisit } from "@/services/nurse-dashboard.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TodayVisitCard } from "@/components/nurse-dashboard/TodayVisitCard";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
}

const StatCard = ({ label, value, icon, gradient, subtitle }: StatCardProps) => (
  <Card className="p-4 sm:p-5 rounded-2xl relative overflow-hidden transition-all hover:shadow-md hover:border-fcn-primary/20">
    <div className="flex items-center gap-3.5">
      <div className={clsx("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm", gradient)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-2xl sm:text-3xl font-extrabold text-fcn-text-light dark:text-fcn-text-dark">
          {value}
        </p>
        <p className="text-xs font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60 truncate">
          {label}
        </p>
        {subtitle && (
          <p className="text-[11px] font-medium text-fcn-text-light/40 dark:text-fcn-text-dark/40 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  </Card>
);

export const NurseDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(" ")[0] ?? "Nurse";
  const isRural = user?.role === "rural_health_officer";
  const [historyOpen, setHistoryOpen] = useState(false);

  const visitLabel = isRural ? "field case" : "home visit";
  const visitLabelPlural = isRural ? "field cases" : "home visits";

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
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-fcn-primary/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                {greeting}, {firstName}
              </h1>
              <Badge variant="info" size="sm">{isRural ? "Field Officer" : "Community Nurse"}</Badge>
            </div>
            <p className="text-xs sm:text-sm font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
              {stats?.today_visits ?? 0} {visitLabelPlural} scheduled for patient care today
            </p>
          </div>
        </div>

        <a
          href="/health-records/nurse"
          className="inline-flex items-center gap-2 rounded-xl bg-fcn-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-fcn-primary/90 transition-colors self-start sm:self-auto"
        >
          <Activity className="h-4 w-4" />
          Quick Vitals Log
        </a>
      </div>

      {/* 3 Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
          <StatCard
            label={`Today's ${visitLabelPlural}`}
            value={stats.today_visits}
            icon={<Calendar className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
            subtitle="Scheduled in community"
          />
          <StatCard
            label="Completed This Week"
            value={stats.completed_this_week}
            icon={<Activity className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            subtitle="Care visits delivered"
          />
          <StatCard
            label="Total Patients Served"
            value={stats.patients_served}
            icon={<Users className="h-6 w-6" />}
            gradient="bg-gradient-to-br from-sky-500 to-blue-600"
            subtitle="Cumulative patients"
          />
        </div>
      )}

      {/* Today's Schedule */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/70 dark:text-fcn-text-dark/70 flex items-center gap-2">
            <Clock className="h-4 w-4 text-fcn-primary" />
            Today's Care Visits
          </h2>
        </div>
        {todayLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-fcn-primary/5" />
            ))}
          </div>
        ) : todayVisits.length === 0 ? (
          <Card className="p-8 text-center rounded-2xl">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500/40 mb-2" />
            <p className="text-sm font-bold text-fcn-text-light dark:text-fcn-text-dark">
              No {visitLabelPlural} scheduled today
            </p>
            <p className="text-xs text-fcn-text-light/40 mt-1">
              Check upcoming schedules or record a field vital directly.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayVisits.map((v, i) => (
              <TodayVisitCard key={v.id} visit={v} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Visits */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/70 dark:text-fcn-text-dark/70 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-fcn-accent" />
          Upcoming {visitLabelPlural}
        </h2>
        {upcomingLoading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-fcn-primary/5" />
        ) : upcomingVisits.length === 0 ? (
          <Card className="p-6 text-center rounded-2xl">
            <p className="text-xs font-medium text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              No upcoming {visitLabelPlural} scheduled.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-fcn-primary/10 rounded-2xl overflow-hidden p-0">
            {upcomingVisits.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-4 hover:bg-fcn-primary/5 transition-colors">
                <div>
                  <p className="text-sm font-bold text-fcn-text-light dark:text-fcn-text-dark">{v.patient_name}</p>
                  <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 mt-0.5">
                    {format(parseISO(v.scheduled_at), "MMM d, h:mm a")}
                    {v.home_address && ` • ${v.home_address}`}
                  </p>
                </div>
                <Button size="sm" variant="secondary">
                  Prepare
                </Button>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* Past Visit History */}
      <section className="space-y-3">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-fcn-text-light/70 dark:text-fcn-text-dark/70 hover:text-fcn-primary transition-colors"
        >
          {historyOpen ? <ChevronDown className="h-4 w-4 text-fcn-primary" /> : <ChevronRight className="h-4 w-4 text-fcn-primary" />}
          Past Care History
        </button>

        {historyOpen && (
          historyLoading ? (
            <div className="h-24 animate-pulse rounded-2xl bg-fcn-primary/5" />
          ) : visitHistory.length === 0 ? (
            <Card className="p-4 text-center rounded-2xl">
              <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">No past {visitLabelPlural} recorded</p>
            </Card>
          ) : (
            <Card className="divide-y divide-fcn-primary/10 rounded-2xl overflow-hidden p-0">
              {visitHistory.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between p-3.5">
                  <div>
                    <p className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">{v.patient_name}</p>
                    <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                      {format(parseISO(v.scheduled_at), "MMM d, yyyy")} • {v.appointment_type}
                    </p>
                  </div>
                  <Badge variant="success" size="sm">Completed</Badge>
                </div>
              ))}
              <div className="p-3 text-center bg-fcn-surface-light dark:bg-fcn-dark">
                <a href="/nurse/patients" className="text-xs font-semibold text-fcn-primary hover:underline">
                  View Full Patient Log →
                </a>
              </div>
            </Card>
          )
        )}
      </section>
    </div>
  );
};

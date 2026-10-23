import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, CheckCircle2, Users, HeartHandshake, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getNurseStats, getTodayVisits, getUpcomingVisits, type TodayVisit, type UpcomingVisit } from "@/services/nurse-dashboard.service";
import { TodayVisitCard } from "@/components/nurse-dashboard/TodayVisitCard";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

interface StatCardProps {
  icon: typeof Clock;
  label: string;
  value: number;
  gradient: string;
}

const StatCard = ({ icon: Icon, label, value, gradient }: StatCardProps) => (
  <Card className="p-4 sm:p-5 rounded-2xl relative overflow-hidden flex items-center gap-3.5 transition-all hover:shadow-md hover:border-fcn-primary/20">
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${gradient}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-mono text-2xl sm:text-3xl font-extrabold text-fcn-text-light dark:text-fcn-text-dark">
        {value}
      </p>
      <p className="text-xs font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60 truncate">
        {label}
      </p>
    </div>
  </Card>
);

const NurseTodayVisitsPage = () => {
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["nurse-stats"],
    queryFn: () => getNurseStats(),
  });

  const { data: todayVisits, isLoading: loadingToday } = useQuery({
    queryKey: ["nurse-today-visits"],
    queryFn: () => getTodayVisits(),
  });

  const { data: upcomingVisits, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["nurse-upcoming-visits"],
    queryFn: () => getUpcomingVisits(),
  });

  const statsData = (stats as any)?.data;
  const todayData = (todayVisits as any)?.data ?? [];
  const upcomingData = (upcomingVisits as any)?.data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-8">
      <PageHeader
        title="Today's Care Schedule"
        description={`${format(new Date(), "EEEE, MMMM d, yyyy")} • Community health visits & patient check-ins`}
        icon={Calendar}
        iconVariant="emerald"
        eyebrow="Community Nursing"
        actions={
          <a
            href="/health-records/nurse"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition-all self-start sm:self-auto"
          >
            Record Vitals Directly
          </a>
        }
      />

      {loadingStats ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-fcn-primary/5" />
          ))}
        </div>
      ) : statsData && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={MapPin} label="Today's Visits" value={statsData.today_visits} gradient="bg-gradient-to-br from-indigo-500 to-violet-600" />
          <StatCard icon={Calendar} label="Upcoming" value={statsData.upcoming_visits} gradient="bg-gradient-to-br from-teal-500 to-emerald-600" />
          <StatCard icon={CheckCircle2} label="Completed This Week" value={statsData.completed_this_week} gradient="bg-gradient-to-br from-emerald-500 to-teal-700" />
          <StatCard icon={Users} label="Patients Served" value={statsData.patients_served} gradient="bg-gradient-to-br from-sky-500 to-blue-600" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Visits - Left 2 Columns */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/70 dark:text-fcn-text-dark/70 flex items-center gap-2">
            <Clock className="h-4 w-4 text-fcn-primary" />
            Scheduled for Today
          </h2>
          {loadingToday ? (
            <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
          ) : todayData.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center rounded-2xl">
              <CheckCircle2 className="h-12 w-12 text-emerald-500/30 mb-3" />
              <p className="text-base font-bold text-fcn-text-light dark:text-fcn-text-dark">No visits scheduled today</p>
              <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 mt-1">Check upcoming days or review patient medical records.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayData.map((visit: TodayVisit, idx: number) => (
                <TodayVisitCard key={visit.id} visit={visit} index={idx} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Visits - Right Column */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/70 dark:text-fcn-text-dark/70 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-fcn-accent" />
            Upcoming Days
          </h2>
          {loadingUpcoming ? (
            <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
          ) : upcomingData.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-10 text-center rounded-2xl">
              <Clock className="h-10 w-10 text-fcn-text-light/20 dark:text-fcn-text-dark/20 mb-2" />
              <p className="text-xs font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60">No upcoming visits</p>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {upcomingData.map((visit: UpcomingVisit) => (
                <Card key={visit.id} className="p-3.5 rounded-2xl hover:border-fcn-primary/20 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-fcn-text-light dark:text-fcn-text-dark">{visit.patient_name}</p>
                      <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 mt-0.5">
                        {format(parseISO(visit.scheduled_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <Badge variant="info" size="sm">
                      {visit.appointment_type.replace("_", " ")}
                    </Badge>
                  </div>
                  {visit.home_address && (
                    <p className="mt-2 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 flex items-center gap-1.5 truncate">
                      <MapPin className="h-3 w-3 text-fcn-primary shrink-0" />
                      {visit.home_address}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NurseTodayVisitsPage;

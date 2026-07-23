import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { MapPin, Calendar, Clock, CheckCircle2, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getNurseStats, getTodayVisits, getUpcomingVisits, type TodayVisit, type UpcomingVisit } from "@/services/nurse-dashboard.service";
import { TodayVisitCard } from "@/components/nurse-dashboard/TodayVisitCard";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";

const StatCard = ({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: number; color: string }) => (
  <Card className="flex items-center gap-4">
    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">{value}</p>
      <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">{label}</p>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Today's Visits</h1>
        <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {loadingStats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-fcn-primary/5" />
          ))}
        </div>
      ) : statsData && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={MapPin} label="Today's Visits" value={statsData.today_visits} color="bg-fcn-accent" />
          <StatCard icon={Calendar} label="Upcoming" value={statsData.upcoming_visits} color="bg-fcn-primary" />
          <StatCard icon={CheckCircle2} label="Completed This Week" value={statsData.completed_this_week} color="bg-fcn-success" />
          <StatCard icon={Users} label="Patients Served" value={statsData.patients_served} color="bg-fcn-indigo" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">Today's Schedule</h2>
          {loadingToday ? (
            <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
          ) : todayData.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-10 w-10 text-fcn-text-light/20 dark:text-fcn-text-dark/20 mb-3" />
              <p className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">No visits today</p>
              <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">Enjoy your free time</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayData.map((visit: TodayVisit, idx: number) => (
                <TodayVisitCard key={visit.id} visit={visit} index={idx} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">Upcoming Visits</h2>
          {loadingUpcoming ? (
            <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
          ) : upcomingData.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-10 w-10 text-fcn-text-light/20 dark:text-fcn-text-dark/20 mb-3" />
              <p className="font-semibold text-fcn-text-light dark:text-fcn-text-dark">No upcoming visits</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingData.map((visit: UpcomingVisit) => (
                <motion.div
                  key={visit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card hoverable className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark truncate">{visit.patient_name}</p>
                      <Badge variant={visit.status === "confirmed" ? "success" : "info"} size="sm">{visit.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(visit.scheduled_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                    {visit.home_address && (
                      <p className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {visit.home_address}
                      </p>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NurseTodayVisitsPage;

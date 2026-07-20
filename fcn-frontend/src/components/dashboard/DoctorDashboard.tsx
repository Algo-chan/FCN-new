import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { format } from "date-fns";
import { clsx } from "clsx";
import { Calendar, Clock, Users, Star, AlertTriangle } from "lucide-react";
import { getDoctorStats, getActivePatients, type ActivePatient } from "@/services/doctor-dashboard.service";
import { AvailabilityStatusToggle } from "@/components/doctors/AvailabilityStatusToggle";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { DoctorScheduleView } from "@/components/doctor-dashboard/DoctorScheduleView";
import { ActivePatientCard } from "@/components/doctor-dashboard/ActivePatientCard";
import { PreviousPatientsSection } from "@/components/doctor-dashboard/PreviousPatientsSection";
import { EarningsSummaryPanel } from "@/components/doctor-dashboard/EarningsSummaryPanel";

const StatCard = ({ label, value, icon, color, subtitle }: { label: string; value: number; icon: React.ReactNode; color: string; subtitle?: string }) => (
  <Card className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
    <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg ${color}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-lg md:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">{value}</p>
      <p className="text-[10px] md:text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60 truncate">{label}</p>
      {subtitle && <p className="text-[9px] md:text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40 mt-0.5 truncate">{subtitle}</p>}
    </div>
  </Card>
);

export const DoctorDashboard = () => {
  const user = useAuthStore((s) => s.user);
  const doctorId = user?.id ?? "";
  const lastName = user?.full_name?.split(" ").slice(-1)[0] ?? "Doctor";

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["doctor-stats", doctorId],
    queryFn: () => getDoctorStats(),
  });

  const { data: activeRes, isLoading: activeLoading } = useQuery({
    queryKey: ["active-patients", doctorId],
    queryFn: () => getActivePatients(),
  });

  const stats = statsRes?.data;
  const activePatients = activeRes?.data ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  let subtitle = "";
  if (stats) {
    if (stats.pending_requests > 0) {
      subtitle = `${stats.pending_requests} patient${stats.pending_requests > 1 ? "s" : ""} waiting for confirmation`;
    } else if (stats.today_appointments > 0) {
      subtitle = `${stats.today_appointments} consultation${stats.today_appointments > 1 ? "s" : ""} today`;
    } else {
      subtitle = "No appointments today — enjoy your rest";
    }
  }

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-fcn-primary/5" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl bg-fcn-primary/5" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4">
        <div>
          <h1 className="text-base md:text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            {greeting}, Dr. {lastName} 👨‍⚕️
          </h1>
          {subtitle && (
            <p className={clsx("text-xs md:text-sm mt-1", stats?.pending_requests ? "text-fcn-warning" : "text-fcn-text-light/60 dark:text-fcn-text-dark/60")}>
              {subtitle}
            </p>
          )}
        </div>
        {stats && (
          <AvailabilityStatusToggle currentStatus={stats.current_status} doctorId={doctorId} />
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          <StatCard
            label="Today's Appointments"
            value={stats.today_appointments}
            icon={<Calendar className="h-5 w-5 text-white" />}
            color="bg-fcn-primary"
            subtitle={stats.week_appointments > 0 ? `${stats.week_appointments} this week` : undefined}
          />
          <StatCard
            label="Pending Requests"
            value={stats.pending_requests}
            icon={<Clock className="h-5 w-5 text-white" />}
            color="bg-fcn-warning"
          />
          <StatCard
            label="Total Patients"
            value={stats.total_patients}
            icon={<Users className="h-5 w-5 text-white" />}
            color="bg-fcn-accent"
          />
          <StatCard
            label="Rating Average"
            value={stats.rating_average}
            icon={<Star className="h-5 w-5 text-white" />}
            color="bg-fcn-indigo"
            subtitle={`${stats.rating_count} reviews`}
          />
        </div>
      )}

      <section>
        <h2 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark mb-3">Schedule</h2>
        <DoctorScheduleView doctorId={doctorId} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark mb-3">Current Patients</h2>
          {activeLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-xl bg-fcn-primary/5" />
              ))}
            </div>
          ) : activePatients.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">No active patients right now</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {activePatients.map((p: ActivePatient, i: number) => (
                <ActivePatientCard key={p.patient_id} patient={p} index={i} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark mb-3">Pending Requests</h2>
          {statsLoading ? (
            <div className="h-32 animate-pulse rounded-xl bg-fcn-primary/5" />
          ) : (!stats || stats.pending_requests === 0) ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">No pending requests</p>
            </Card>
          ) : (
            <Card className="p-4 space-y-3">
              {Array.from({ length: stats.pending_requests }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-fcn-primary/10">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-fcn-warning" />
                    <div>
                      <p className="text-xs font-medium text-fcn-text-light dark:text-fcn-text-dark">Patient Request #{i + 1}</p>
                      <p className="text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">Pending confirmation</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-fcn-success/10 text-fcn-success cursor-pointer">Confirm</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-fcn-danger/10 text-fcn-danger cursor-pointer">Decline</span>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <PreviousPatientsSection />
        </section>
        <section>
          <EarningsSummaryPanel />
        </section>
      </div>
    </div>
  );
};

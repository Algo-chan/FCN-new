import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { format } from "date-fns";
import { clsx } from "clsx";
import { Calendar, Clock, Users, Star, AlertTriangle, Stethoscope, ChevronRight, Activity, TrendingUp, CheckCircle } from "lucide-react";
import { getDoctorStats, getActivePatients, type ActivePatient } from "@/services/doctor-dashboard.service";
import { AvailabilityStatusToggle } from "@/components/doctors/AvailabilityStatusToggle";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DoctorScheduleView } from "@/components/doctor-dashboard/DoctorScheduleView";
import { ActivePatientCard } from "@/components/doctor-dashboard/ActivePatientCard";
import { PreviousPatientsSection } from "@/components/doctor-dashboard/PreviousPatientsSection";
import { EarningsSummaryPanel } from "@/components/doctor-dashboard/EarningsSummaryPanel";
import { PageHeader } from "@/components/ui/PageHeader";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
  badge?: string;
}

const StatCard = ({ label, value, icon, gradient, subtitle, badge }: StatCardProps) => (
  <Card className="p-4 sm:p-5 rounded-2xl relative overflow-hidden transition-all hover:shadow-md hover:border-fcn-primary/20">
    <div className="flex items-center justify-between mb-3">
      <div className={clsx("flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm", gradient)}>
        {icon}
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-fcn-primary/10 text-fcn-primary">
          {badge}
        </span>
      )}
    </div>
    <div className="space-y-0.5">
      <p className="font-mono text-2xl sm:text-3xl font-extrabold text-fcn-text-light dark:text-fcn-text-dark">
        {value}
      </p>
      <p className="text-xs font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60 truncate">
        {label}
      </p>
      {subtitle && (
        <p className="text-[11px] font-medium text-fcn-text-light/40 dark:text-fcn-text-dark/40 pt-1 border-t border-fcn-primary/5 truncate">
          {subtitle}
        </p>
      )}
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
      subtitle = `${stats.today_appointments} consultation${stats.today_appointments > 1 ? "s" : ""} scheduled today`;
    } else {
      subtitle = "No appointments right now — schedule is clear";
    }
  }

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-fcn-primary/5" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-fcn-primary/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <PageHeader
        title={`${greeting}, Dr. ${lastName}`}
        description={subtitle || "Physician Clinical Practice & Telehealth Operations"}
        icon={Stethoscope}
        iconVariant="teal"
        actions={
          stats && (
            <div className="self-start sm:self-auto">
              <AvailabilityStatusToggle currentStatus={stats.current_status} doctorId={doctorId} />
            </div>
          )
        }
      />

      {/* 4 Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Today's Appointments"
            value={stats.today_appointments}
            icon={<Calendar className="h-5 w-5" />}
            gradient="bg-gradient-to-br from-teal-500 to-emerald-600"
            subtitle={stats.week_appointments > 0 ? `${stats.week_appointments} this week` : "None scheduled"}
          />
          <StatCard
            label="Pending Requests"
            value={stats.pending_requests}
            icon={<Clock className="h-5 w-5" />}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            badge={stats.pending_requests > 0 ? "Action Needed" : undefined}
          />
          <StatCard
            label="Total Patients"
            value={stats.total_patients}
            icon={<Users className="h-5 w-5" />}
            gradient="bg-gradient-to-br from-sky-500 to-blue-600"
            subtitle="Registered in care"
          />
          <StatCard
            label="Rating Score"
            value={stats.rating_average}
            icon={<Star className="h-5 w-5" />}
            gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
            subtitle={`${stats.rating_count} patient reviews`}
          />
        </div>
      )}

      {/* Weekly Schedule Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/70 dark:text-fcn-text-dark/70 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-fcn-primary" />
            Weekly Consultation Schedule
          </h2>
        </div>
        <DoctorScheduleView doctorId={doctorId} />
      </section>

      {/* Current Patients & Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/70 dark:text-fcn-text-dark/70 flex items-center gap-2">
              <Activity className="h-4 w-4 text-fcn-primary" />
              Active Patients in Care
            </h2>
          </div>
          {activeLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-fcn-primary/5" />
              ))}
            </div>
          ) : activePatients.length === 0 ? (
            <Card className="p-8 text-center rounded-2xl">
              <Users className="mx-auto h-10 w-10 text-fcn-text-light/20 mb-2" />
              <p className="text-sm font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                No active patients right now
              </p>
              <p className="text-xs text-fcn-text-light/40 mt-1">
                Patients with confirmed consultations will appear here.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {activePatients.map((p: ActivePatient, i: number) => (
                <ActivePatientCard key={p.patient_id} patient={p} index={i} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-fcn-text-light/70 dark:text-fcn-text-dark/70 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending Appointment Requests
            </h2>
          </div>
          {statsLoading ? (
            <div className="h-32 animate-pulse rounded-2xl bg-fcn-primary/5" />
          ) : (!stats || stats.pending_requests === 0) ? (
            <Card className="p-8 text-center rounded-2xl">
              <CheckCircle className="mx-auto h-10 w-10 text-emerald-500/40 mb-2" />
              <p className="text-sm font-semibold text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                All caught up!
              </p>
              <p className="text-xs text-fcn-text-light/40 mt-1">
                No pending requests requiring your confirmation.
              </p>
            </Card>
          ) : (
            <Card className="p-4 sm:p-5 space-y-3 rounded-2xl">
              {Array.from({ length: stats.pending_requests }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-fcn-primary/10 bg-fcn-surface-light dark:bg-fcn-dark/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-fcn-text-light dark:text-fcn-text-dark">Patient Consultation #{i + 1}</p>
                      <p className="text-[11px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">Awaiting your confirmation</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors">
                      Accept
                    </button>
                    <button className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </section>
      </div>

      {/* Patient History and Earnings Summary */}
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

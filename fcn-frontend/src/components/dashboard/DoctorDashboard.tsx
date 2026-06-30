import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Stethoscope,
  Users,
  Bell
} from "lucide-react";
import { dashboardService, type DoctorDashboardData } from "@/services/dashboard.service";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { useNotifications } from "@/hooks/useNotifications";

const StatCard = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) => (
  <Card className="flex items-center gap-4">
    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">{value}</p>
      <p className="text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">{label}</p>
    </div>
  </Card>
);

export const DoctorDashboard = () => {
  const [data, setData] = useState<DoctorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useNotifications();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getDoctorDashboard();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error?.message ?? "Failed to load dashboard");
      }
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <SkeletonCard lines={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-fcn-danger">{error}</p>
        <Button onClick={fetchDashboard} className="mt-4">Retry</Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
          Doctor Dashboard
        </h1>
        <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          Manage your patients and appointments
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Appointments"
          value={data.todayAppointmentsCount}
          icon={<Calendar className="h-5 w-5 text-white" />}
          color="bg-fcn-primary"
        />
        <StatCard
          label="Total Patients"
          value={data.totalPatients}
          icon={<Users className="h-5 w-5 text-white" />}
          color="bg-fcn-accent"
        />
        <StatCard
          label="Pending Requests"
          value={data.pendingAppointments}
          icon={<Clock className="h-5 w-5 text-white" />}
          color="bg-fcn-warning"
        />
        <StatCard
          label="Notifications"
          value={data.unreadNotifications}
          icon={<Bell className="h-5 w-5 text-white" />}
          color="bg-fcn-primary/80"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              Upcoming Appointments
            </h2>
            <Link to="/appointments" className="text-sm text-fcn-primary hover:underline">
              View all
            </Link>
          </div>
          {data.upcomingAppointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              No upcoming appointments
            </p>
          ) : (
            <ul className="divide-y divide-fcn-primary/10">
              {data.upcomingAppointments.map((apt) => (
                <li key={apt.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                      {apt.patient.full_name}
                    </p>
                    <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                      {new Date(apt.scheduled_at).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <Badge variant={apt.status === "confirmed" ? "success" : "info"} size="sm">
                    {apt.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              Recent Patients
            </h2>
            <Link to="/patients" className="text-sm text-fcn-primary hover:underline">
              View all
            </Link>
          </div>
          {data.recentPatients.length === 0 ? (
            <p className="py-8 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              No recent patients
            </p>
          ) : (
            <ul className="divide-y divide-fcn-primary/10">
              {data.recentPatients.map((rp, idx) => (
                <li key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fcn-primary/10 text-xs font-semibold text-fcn-primary">
                      {rp.patient.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                      {rp.patient.full_name}
                    </p>
                  </div>
                  <span className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                    {new Date(rp.updated_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              Quick Actions
            </h2>
            <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              Frequently used actions
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link to="/appointments/book">
            <Button variant="secondary" size="sm" className="w-full">
              <Calendar className="h-4 w-4" />
              New Appointment
            </Button>
          </Link>
          <Link to="/prescriptions">
            <Button variant="secondary" size="sm" className="w-full">
              <Stethoscope className="h-4 w-4" />
              Write Prescription
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Bell,
  Calendar,
  Clock,
  MapPin,
  Users
} from "lucide-react";
import { dashboardService, type NurseDashboardData } from "@/services/dashboard.service";
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

export const NurseDashboard = () => {
  const [data, setData] = useState<NurseDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useNotifications();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getNurseDashboard();
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

  const statusVariant = (status: string): "success" | "warning" | "info" | "danger" | "neutral" => {
    switch (status) {
      case "confirmed":
        return "success";
      case "scheduled":
        return "info";
      case "pending":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
          Nurse Dashboard
        </h1>
        <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          Track your assigned patients and visits
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Assigned Patients"
          value={data.assignedPatientsCount}
          icon={<Users className="h-5 w-5 text-white" />}
          color="bg-fcn-primary"
        />
        <StatCard
          label="Today's Visits"
          value={data.todayVisitsCount}
          icon={<Calendar className="h-5 w-5 text-white" />}
          color="bg-fcn-accent"
        />
        <StatCard
          label="Vitals Recorded"
          value={data.recentVitals.length}
          icon={<Activity className="h-5 w-5 text-white" />}
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
              Upcoming Visits
            </h2>
            <Link to="/appointments" className="text-sm text-fcn-primary hover:underline">
              View all
            </Link>
          </div>
          {data.upcomingVisits.length === 0 ? (
            <p className="py-8 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              No upcoming visits scheduled
            </p>
          ) : (
            <ul className="divide-y divide-fcn-primary/10">
              {data.upcomingVisits.map((visit) => (
                <li key={visit.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-fcn-primary" />
                    <div>
                      <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                        {visit.patient.full_name}
                      </p>
                      <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                        {new Date(visit.scheduled_at).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusVariant(visit.status)} size="sm">
                    {visit.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              Recent Vital Recordings
            </h2>
            <Link to="/health-records" className="text-sm text-fcn-primary hover:underline">
              View all
            </Link>
          </div>
          {data.recentVitals.length === 0 ? (
            <p className="py-8 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              No vitals recorded yet
            </p>
          ) : (
            <ul className="divide-y divide-fcn-primary/10">
              {data.recentVitals.map((vital) => (
                <li key={vital.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                      {vital.patient.full_name}
                    </p>
                    <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                      BP: {vital.bp_systolic ?? "—"}/{vital.bp_diastolic ?? "—"} &middot; HR: {vital.heart_rate_bpm ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-fcn-text-light/40" />
                    <span className="text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                      {new Date(vital.recorded_at).toLocaleDateString()}
                    </span>
                  </div>
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
          <Link to="/appointments">
            <Button variant="secondary" size="sm" className="w-full">
              <Calendar className="h-4 w-4" />
              Schedule Visit
            </Button>
          </Link>
          <Link to="/patients">
            <Button variant="secondary" size="sm" className="w-full">
              <Users className="h-4 w-4" />
              My Patients
            </Button>
          </Link>
          <Link to="/vaccinations">
            <Button variant="secondary" size="sm" className="w-full">
              <Activity className="h-4 w-4" />
              Vaccinations
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

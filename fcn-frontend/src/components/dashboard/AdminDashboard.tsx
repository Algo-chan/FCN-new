import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Bell,
  Building2,
  Calendar,
  Clock,
  Users,
  Shield,
  UserCheck,
  UserPlus
} from "lucide-react";
import { clsx } from "clsx";
import { dashboardService, type AdminDashboardData } from "@/services/dashboard.service";
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

const roleLabels: Record<string, string> = {
  patient: "Patients",
  doctor: "Doctors",
  nurse: "Nurses",
  rural_health_officer: "Rural Health Officers",
  admin: "Admins"
};

const roleColors: Record<string, string> = {
  patient: "text-fcn-accent",
  doctor: "text-fcn-primary",
  nurse: "text-fcn-warning",
  rural_health_officer: "text-fcn-success",
  admin: "text-fcn-danger"
};

export const AdminDashboard = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useNotifications();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getAdminDashboard();
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
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
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
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          System overview and management
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Users"
          value={data.totalUsers}
          icon={<Users className="h-5 w-5 text-white" />}
          color="bg-fcn-primary"
        />
        <StatCard
          label="Pending Approvals"
          value={data.pendingApprovals}
          icon={<UserPlus className="h-5 w-5 text-white" />}
          color="bg-fcn-warning"
        />
        <StatCard
          label="Active Hospitals"
          value={data.activeHospitals}
          icon={<Building2 className="h-5 w-5 text-white" />}
          color="bg-fcn-accent"
        />
        <StatCard
          label="Today's Appointments"
          value={data.todayAppointments}
          icon={<Calendar className="h-5 w-5 text-white" />}
          color="bg-fcn-primary/80"
        />
        <StatCard
          label="Unread Notifications"
          value={data.unreadNotifications}
          icon={<Bell className="h-5 w-5 text-white" />}
          color="bg-fcn-danger"
        />
        <StatCard
          label="Active Users"
          value={data.totalUsers - data.pendingApprovals}
          icon={<UserCheck className="h-5 w-5 text-white" />}
          color="bg-fcn-success"
        />
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
          Users by Role
        </h2>
        {data.usersByRole.length === 0 ? (
          <p className="py-4 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            No user data available
          </p>
        ) : (
          <div className="space-y-3">
            {data.usersByRole.map((entry) => (
              <div key={entry.role} className="flex items-center gap-4">
                <div className="w-40">
                  <span className={clsx("text-sm font-medium capitalize", roleColors[entry.role] ?? "text-fcn-text-light")}>
                    {roleLabels[entry.role] ?? entry.role}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="h-2.5 overflow-hidden rounded-full bg-fcn-primary/10">
                    <div
                      className="h-full rounded-full bg-fcn-primary transition-all duration-500"
                      style={{
                        width: `${data.totalUsers > 0 ? (entry._count.id / data.totalUsers) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
                <span className="w-10 text-right text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                  {entry._count.id}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              Quick Actions
            </h2>
            <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              Administrative tasks
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link to="/admin">
            <Button variant="secondary" size="sm" className="w-full">
              <Shield className="h-4 w-4" />
              Admin Panel
            </Button>
          </Link>
          <Link to="/hospitals">
            <Button variant="secondary" size="sm" className="w-full">
              <Building2 className="h-4 w-4" />
              Manage Hospitals
            </Button>
          </Link>
          <Link to="/notifications">
            <Button variant="secondary" size="sm" className="w-full">
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

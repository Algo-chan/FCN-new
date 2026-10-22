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
  UserPlus,
  ArrowRight,
  TrendingUp,
  Settings,
  Pill
} from "lucide-react";
import { clsx } from "clsx";
import { dashboardService, type AdminDashboardData } from "@/services/dashboard.service";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { useNotifications } from "@/hooks/useNotifications";

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  subtext?: string;
}

const StatCard = ({ label, value, icon, gradient, subtext }: StatCardProps) => (
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
        {subtext && (
          <p className="text-[11px] font-medium text-fcn-text-light/40 dark:text-fcn-text-dark/40 truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  </Card>
);

const roleLabels: Record<string, string> = {
  patient: "Patients",
  doctor: "Physicians",
  nurse: "Nurses",
  rural_health_officer: "Rural Health Officers",
  hospital_admin: "Hospital Admins",
  pharmacy_admin: "Pharmacy Admins",
  admin: "Super Admins"
};

const roleGradients: Record<string, string> = {
  patient: "from-sky-500 to-blue-600",
  doctor: "from-teal-500 to-emerald-600",
  nurse: "from-purple-500 to-indigo-600",
  rural_health_officer: "from-emerald-500 to-teal-700",
  hospital_admin: "from-rose-500 to-red-600",
  pharmacy_admin: "from-amber-500 to-orange-600",
  admin: "from-indigo-600 to-violet-700"
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
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-fcn-primary/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm font-semibold text-rose-500 mb-3">{error}</p>
        <Button onClick={fetchDashboard} variant="primary">Retry Connection</Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-600/20">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              Executive Control Tower
            </h1>
            <p className="text-xs sm:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
              National Fast Care Now user base, capacity, and active services
            </p>
          </div>
        </div>

        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 rounded-xl bg-fcn-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-fcn-primary/90 transition-colors self-start sm:self-auto"
        >
          <span>Open Full Analytics</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 6 Key Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Total Registered Users"
          value={data.totalUsers}
          icon={<Users className="h-6 w-6" />}
          gradient="bg-gradient-to-br from-teal-500 to-emerald-600"
          subtext="Patients & providers"
        />
        <StatCard
          label="Pending Provider Approvals"
          value={data.pendingApprovals}
          icon={<UserPlus className="h-6 w-6" />}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          subtext={data.pendingApprovals > 0 ? "License review needed" : "All verified"}
        />
        <StatCard
          label="Connected Hospitals"
          value={data.activeHospitals}
          icon={<Building2 className="h-6 w-6" />}
          gradient="bg-gradient-to-br from-rose-500 to-red-600"
          subtext="Connected healthcare facilities"
        />
        <StatCard
          label="Today's Consultations"
          value={data.todayAppointments}
          icon={<Calendar className="h-6 w-6" />}
          gradient="bg-gradient-to-br from-sky-500 to-blue-600"
          subtext="Telehealth & visits"
        />
        <StatCard
          label="System Alerts"
          value={data.unreadNotifications}
          icon={<Bell className="h-6 w-6" />}
          gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
          subtext="Critical updates"
        />
        <StatCard
          label="Active Users"
          value={data.totalUsers - data.pendingApprovals}
          icon={<UserCheck className="h-6 w-6" />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          subtext="Fully verified accounts"
        />
      </div>

      {/* Role Breakdown Card */}
      <Card className="p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-fcn-primary/10 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-fcn-primary" />
            <h2 className="text-base font-bold text-fcn-text-light dark:text-fcn-text-dark">
              Platform Demographics by Role
            </h2>
          </div>
          <span className="text-xs font-semibold text-fcn-text-light/50">
            {data.totalUsers} total members
          </span>
        </div>

        {data.usersByRole.length === 0 ? (
          <p className="py-6 text-center text-xs text-fcn-text-light/50">
            No user role breakdown available
          </p>
        ) : (
          <div className="space-y-3.5">
            {data.usersByRole.map((entry) => {
              const pct = data.totalUsers > 0 ? Math.round((entry._count.id / data.totalUsers) * 100) : 0;
              const gradient = roleGradients[entry.role] || "from-fcn-primary to-fcn-accent";
              return (
                <div key={entry.role} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-fcn-text-light dark:text-fcn-text-dark">
                      {roleLabels[entry.role] ?? entry.role}
                    </span>
                    <span className="font-mono text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                      {entry._count.id} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-fcn-primary/10">
                    <div
                      className={clsx("h-full rounded-full bg-gradient-to-r transition-all duration-500", gradient)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick Administrative Actions */}
      <Card className="p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-fcn-primary/10 pb-3">
          <h2 className="text-base font-bold text-fcn-text-light dark:text-fcn-text-dark">
            Administrative Modules
          </h2>
          <span className="text-xs text-fcn-text-light/50">Direct shortcuts</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link to="/admin">
            <Button variant="secondary" size="sm" className="w-full justify-center h-11 text-xs font-semibold rounded-xl">
              <Shield className="h-4 w-4 mr-1.5 text-indigo-500" />
              Full Analytics
            </Button>
          </Link>
          <Link to="/hospitals">
            <Button variant="secondary" size="sm" className="w-full justify-center h-11 text-xs font-semibold rounded-xl">
              <Building2 className="h-4 w-4 mr-1.5 text-rose-500" />
              Hospitals
            </Button>
          </Link>
          <Link to="/pharmacy">
            <Button variant="secondary" size="sm" className="w-full justify-center h-11 text-xs font-semibold rounded-xl">
              <Pill className="h-4 w-4 mr-1.5 text-sky-500" />
              Pharmacies
            </Button>
          </Link>
          <Link to="/notifications">
            <Button variant="secondary" size="sm" className="w-full justify-center h-11 text-xs font-semibold rounded-xl">
              <Bell className="h-4 w-4 mr-1.5 text-amber-500" />
              Notifications
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

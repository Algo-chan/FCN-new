import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Calendar,
  Heart,
  Pill,
  TrendingUp
} from "lucide-react";
import { dashboardService, type PatientDashboardData } from "@/services/dashboard.service";
import { useNotifications } from "@/hooks/useNotifications";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HealthMetricCard } from "@/components/ui/HealthMetricCard";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { HealthScoreModal } from "@/components/dashboard/HealthScoreModal";
import type { VitalStatus } from "@/types";

const getVitalStatus = (value: number | null | undefined, type: "bp_systolic" | "bp_diastolic" | "heart_rate" | "glucose" | "spo2"): VitalStatus => {
  if (value === null || value === undefined) {
    return "normal";
  }
  switch (type) {
    case "bp_systolic":
      return value > 140 || value < 90 ? "critical" : value > 130 ? "warning" : "normal";
    case "bp_diastolic":
      return value > 90 || value < 60 ? "critical" : value > 85 ? "warning" : "normal";
    case "heart_rate":
      return value > 100 || value < 60 ? "warning" : "normal";
    case "glucose":
      return value > 140 || value < 70 ? "warning" : "normal";
    case "spo2":
      return value < 95 ? "warning" : "normal";
    default:
      return "normal";
  }
};

const getAppointmentStatusVariant = (status: string): "success" | "warning" | "danger" | "info" | "neutral" => {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending":
      return "warning";
    case "scheduled":
      return "info";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
};

export const PatientDashboard = () => {
  const [data, setData] = useState<PatientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHealthScore, setShowHealthScore] = useState(false);
  const { addToast } = useNotifications();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getPatientDashboard();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error?.message ?? "Failed to load dashboard");
      }
    } catch {
      setError("Unable to connect to server. Please try again.");
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-fcn-danger">{error}</p>
        <Button onClick={fetchDashboard} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const vitals = data.latestVitals;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            Patient Dashboard
          </h1>
          <p className="mt-1 text-xs md:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            Welcome back! Here is your health overview.
          </p>
        </div>
        {vitals && (
          <button onClick={() => setShowHealthScore(true)}>
            <Card className="flex cursor-pointer items-center gap-2 md:gap-3 border-fcn-accent/30 p-2 md:p-3 transition-colors hover:border-fcn-accent">
              <Activity className="h-5 w-5 md:h-6 md:w-6 text-fcn-accent" />
              <div className="text-right">
                <p className="text-[10px] md:text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">Health Score</p>
                <p className="text-lg md:text-xl font-bold text-fcn-accent">{data.healthScore}</p>
              </div>
            </Card>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <HealthMetricCard
          label="Systolic"
          value={vitals?.bp_systolic ?? 0}
          unit="mmHg"
          status={getVitalStatus(vitals?.bp_systolic, "bp_systolic")}
          icon={<Heart className="h-4 w-4 md:h-5 md:w-5" />}
          trend={vitals?.bp_systolic ? (vitals.bp_systolic > 120 ? "up" : "down") : "stable"}
        />
        <HealthMetricCard
          label="Heart Rate"
          value={vitals?.heart_rate_bpm ?? 0}
          unit="bpm"
          status={getVitalStatus(vitals?.heart_rate_bpm, "heart_rate")}
          icon={<Activity className="h-4 w-4 md:h-5 md:w-5" />}
          trend={vitals?.heart_rate_bpm ? (vitals.heart_rate_bpm > 80 ? "up" : "down") : "stable"}
        />
        <HealthMetricCard
          label="Blood Glucose"
          value={vitals?.blood_glucose_mg_dl ? Number(vitals.blood_glucose_mg_dl) : 0}
          unit="mg/dL"
          status={getVitalStatus(vitals?.blood_glucose_mg_dl ? Number(vitals.blood_glucose_mg_dl) : null, "glucose")}
          icon={<TrendingUp className="h-4 w-4 md:h-5 md:w-5" />}
          trend={vitals?.blood_glucose_mg_dl ? (Number(vitals.blood_glucose_mg_dl) > 100 ? "up" : "down") : "stable"}
        />
        <HealthMetricCard
          label="SpO2"
          value={vitals?.spo2_percent ? Number(vitals.spo2_percent) : 0}
          unit="%"
          status={getVitalStatus(vitals?.spo2_percent ? Number(vitals.spo2_percent) : null, "spo2")}
          icon={<Activity className="h-4 w-4 md:h-5 md:w-5" />}
          trend={vitals?.spo2_percent ? (Number(vitals.spo2_percent) < 98 ? "down" : "stable") : "stable"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              Upcoming Appointments
            </h2>
            <Link
              to="/appointments"
              className="text-xs md:text-sm text-fcn-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {data.upcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Calendar className="mb-2 h-8 w-8 text-fcn-text-light/30 dark:text-fcn-text-dark/30" />
              <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                No upcoming appointments
              </p>
              <Link to="/appointments/book">
                <Button size="sm" className="mt-3">
                  Book Appointment
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-fcn-primary/10">
              {data.upcomingAppointments.map((apt) => (
                <li key={apt.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                      {apt.doctor?.full_name ?? "Doctor"}
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
                  <Badge variant={getAppointmentStatusVariant(apt.status)} size="sm">
                    {apt.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base md:text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              Recent Prescriptions
            </h2>
            <Link
              to="/health-records"
              className="text-xs md:text-sm text-fcn-primary hover:underline"
            >
              View all
            </Link>
          </div>
          {data.activePrescriptions.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Pill className="mb-2 h-8 w-8 text-fcn-text-light/30 dark:text-fcn-text-dark/30" />
              <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                No active prescriptions
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-fcn-primary/10">
              {data.activePrescriptions.map((rx) => (
                <li key={rx.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                      {rx.medications?.[0]?.drug_name ?? "Prescription"}
                    </p>
                    <Badge
                      variant={rx.status === "active" ? "success" : "warning"}
                      size="sm"
                    >
                      {rx.status}
                    </Badge>
                  </div>
                  {rx.medications && rx.medications.length > 1 && (
                    <p className="mt-1 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                      +{rx.medications.length - 1} more medications
                    </p>
                  )}
                  <p className="mt-1 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">
                    Dr. {rx.doctor?.full_name ?? "Unknown"} &middot; {new Date(rx.issued_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base md:text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
              Quick Actions
            </h2>
            <p className="text-xs md:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              Frequently used actions
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:gap-3 sm:grid-cols-4">
          <Link to="/appointments/book">
            <Button variant="secondary" size="sm" className="w-full">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Book Appointment</span>
              <span className="sm:hidden">Book</span>
            </Button>
          </Link>
          <Link to="/doctors">
            <Button variant="secondary" size="sm" className="w-full">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Find Doctors</span>
              <span className="sm:hidden">Doctors</span>
            </Button>
          </Link>
          <Link to="/health-records">
            <Button variant="secondary" size="sm" className="w-full">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Health Records</span>
              <span className="sm:hidden">Records</span>
            </Button>
          </Link>
          <Link to="/pharmacy">
            <Button variant="secondary" size="sm" className="w-full">
              <Pill className="h-4 w-4" />
              Pharmacy
            </Button>
          </Link>
        </div>
      </Card>

      <HealthScoreModal
        isOpen={showHealthScore}
        onClose={() => setShowHealthScore(false)}
        score={data.healthScore}
        vitals={vitals}
      />
    </div>
  );
};

import { useCallback, useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Calendar,
  Heart,
  Pill,
  Sparkles,
  Stethoscope,
  Building2,
  TrendingUp,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { dashboardService, type PatientDashboardData } from "@/services/dashboard.service";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HealthMetricCard } from "@/components/ui/HealthMetricCard";
import { CircularProgress } from "@/components/ui/CircularProgress";
import { FitnessCard } from "@/components/ui/FitnessCard";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { HealthScoreModal } from "@/components/dashboard/HealthScoreModal";
import { LifelinePulse } from "./LifelinePulse";
import { getAppointmentTimeInfo } from "@/utils/appointment-time";
import type { VitalStatus } from "@/types";
import { clsx } from "clsx";

const getVitalStatus = (
  value: number | null | undefined,
  type: "bp_systolic" | "bp_diastolic" | "heart_rate" | "glucose" | "spo2"
): VitalStatus => {
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

const getAppointmentStatusVariant = (
  status: string
): "success" | "warning" | "danger" | "info" | "neutral" => {
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

const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const PatientDashboard = () => {
  const [data, setData] = useState<PatientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHealthScore, setShowHealthScore] = useState(false);
  const { addToast } = useNotifications();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

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

  const greeting = useMemo(() => getTimeGreeting(), []);
  const firstName = user?.full_name?.split(" ")[0] ?? "Friend";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-36 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <Heart className="w-8 h-8" />
        </div>
        <p className="text-rose-600 dark:text-rose-400 font-bold mb-4">{error}</p>
        <Button variant="action" onClick={fetchDashboard}>
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!data) return null;

  const vitals = data.latestVitals;
  const nextAppointment = data.upcomingAppointments[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Pattern #6: Greeting Header with Today's Summary Card & Overflowing 3D African Doctor */}
      <div className="relative mt-2 sm:mt-12 overflow-visible rounded-[24px] sm:rounded-3xl border border-teal-500/30 bg-gradient-to-br from-teal-700 via-teal-800 to-sky-950 p-5 sm:p-7 text-white shadow-[0_20px_50px_rgba(13,148,136,0.3)]">
        {/* Subtle background telemetry watermark */}
        <img
          src="/images/medical/ecg-monitor.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-10 left-1/4 z-0 h-44 w-44 object-contain opacity-[0.08] select-none"
        />

        {/* Overflowing 3D African Female Doctor standing on the right edge (Hidden on mobile) */}
        <img
          src="/images/doctors/doctor-african-female.png"
          alt="Dr. Hanna - Fast Care Now"
          aria-hidden="true"
          className="pointer-events-none absolute hidden sm:block sm:-top-16 right-4 lg:right-8 z-20 sm:h-64 lg:h-72 object-contain select-none drop-shadow-[0_25px_40px_rgba(4,30,40,0.65)]"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:pr-48 lg:pr-56">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-teal-200 text-[11px] font-semibold mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Dire Dawa Network Online
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
              {greeting}, {firstName}!
              <span className="hidden sm:inline-block ml-2 select-none" aria-hidden="true">
                👋
              </span>
            </h1>

            {/* Medical Lifeline EKG pulse - active only on mobile screens, edge-to-edge from left to right border of the box */}
            <div className="sm:hidden -mx-5 my-2 w-[calc(100%+2.5rem)]">
              <LifelinePulse />
            </div>

            <p className="mt-1 text-xs sm:text-sm text-teal-100/90 font-medium max-w-md line-clamp-2">
              {nextAppointment
                ? `You have an upcoming appointment with Dr. ${nextAppointment.doctor?.full_name ?? "Doctor"}.`
                : "Your health records are up to date. Consult our doctors or AI triage anytime."}
            </p>
          </div>

          {/* Health Score Circular Ring (Pattern #4) */}
          <div
            onClick={() => setShowHealthScore(true)}
            className="flex-shrink-0 flex items-center gap-3.5 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-2.5 sm:p-3.5 border border-white/15 cursor-pointer transition-all active:scale-95 select-none self-start lg:self-auto"
            role="button"
            tabIndex={0}
            title="View Health Score Breakdown"
          >
            <CircularProgress
              value={data.healthScore}
              max={100}
              size={60}
              strokeWidth={6}
              color="emerald"
              showValue={true}
            />
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200">
                Health Score
              </span>
              <p className="text-base sm:text-lg font-black text-white leading-tight">
                {data.healthScore >= 80 ? "Optimal" : data.healthScore >= 60 ? "Good" : "Needs Review"}
              </p>
              <span className="text-[10px] sm:text-[11px] text-teal-100/70 font-semibold underline">
                View breakdown →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern #2: Home Action Cards (One card = One action, 20-24px radius, colorful gradients) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Get Care & Services
          </h2>
          <span className="text-xs text-slate-400 font-medium">Quick Access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <FitnessCard
            title="AI Health Check"
            subtitle="Describe symptoms for instant clinical triage"
            icon={<Sparkles className="w-6 h-6 text-white" />}
            gradient="violet"
            onClick={() => navigate("/ai-check")}
            bgToolImage="/images/medical/ecg-monitor.svg"
          />

          <FitnessCard
            title="Consult a Doctor"
            subtitle="Book phone or video appointment today"
            icon={<Stethoscope className="w-6 h-6 text-white" />}
            gradient="clinical"
            onClick={() => navigate("/appointments/book")}
            bgToolImage="/images/medical/stethoscope.svg"
          />

          <FitnessCard
            title="Hospital Capacity"
            subtitle="Check real-time occupancy and ICU beds"
            icon={<Building2 className="w-6 h-6 text-white" />}
            gradient="coral"
            onClick={() => navigate("/hospitals")}
            bgToolImage="/images/medical/medical-kit.svg"
          />

          <FitnessCard
            title="Pharmacy & Rx"
            subtitle="Order refills and view prescriptions"
            icon={<Pill className="w-6 h-6 text-white" />}
            gradient="amber"
            onClick={() => navigate("/pharmacy")}
            bgToolImage="/images/medical/capsules.svg"
          />
        </div>
      </div>

      {/* Pattern #5: Big stat numbers in heavy weight type with small muted labels beneath */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Latest Vitals
          </h2>
          <Link
            to="/health-records"
            className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            View Health Records →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <HealthMetricCard
            label="Systolic BP"
            value={vitals?.bp_systolic ?? 0}
            unit="mmHg"
            status={getVitalStatus(vitals?.bp_systolic, "bp_systolic")}
            icon={<Heart className="h-4 w-4 sm:h-5 sm:w-5" />}
            trend={vitals?.bp_systolic ? (vitals.bp_systolic > 120 ? "up" : "down") : "stable"}
          />
          <HealthMetricCard
            label="Heart Rate"
            value={vitals?.heart_rate_bpm ?? 0}
            unit="bpm"
            status={getVitalStatus(vitals?.heart_rate_bpm, "heart_rate")}
            icon={<Activity className="h-4 w-4 sm:h-5 sm:w-5" />}
            trend={vitals?.heart_rate_bpm ? (vitals.heart_rate_bpm > 80 ? "up" : "down") : "stable"}
          />
          <HealthMetricCard
            label="Blood Glucose"
            value={vitals?.blood_glucose_mg_dl ? Number(vitals.blood_glucose_mg_dl) : 0}
            unit="mg/dL"
            status={getVitalStatus(
              vitals?.blood_glucose_mg_dl ? Number(vitals.blood_glucose_mg_dl) : null,
              "glucose"
            )}
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
            trend={
              vitals?.blood_glucose_mg_dl
                ? Number(vitals.blood_glucose_mg_dl) > 100
                  ? "up"
                  : "down"
                : "stable"
            }
          />
          <HealthMetricCard
            label="Blood Oxygen"
            value={vitals?.spo2_percent ? Number(vitals.spo2_percent) : 0}
            unit="%"
            status={getVitalStatus(
              vitals?.spo2_percent ? Number(vitals.spo2_percent) : null,
              "spo2"
            )}
            icon={<Activity className="h-4 w-4 sm:h-5 sm:w-5" />}
            trend={
              vitals?.spo2_percent
                ? Number(vitals.spo2_percent) < 98
                  ? "down"
                  : "stable"
                : "stable"
            }
          />
        </div>
      </div>

      {/* Two Column Layout: Upcoming Appointments & Recent Prescriptions */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <div className="rounded-[22px] border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Upcoming Appointments
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Scheduled consultations
              </p>
            </div>
            <Link
              to="/appointments"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              View all
            </Link>
          </div>

          {data.upcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 p-6">
              <Calendar className="mb-2 h-9 w-9 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No upcoming appointments
              </p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                Need to speak with a physician? Browse verified doctors available today.
              </p>
              <Button
                variant="action"
                size="sm"
                className="mt-4 min-h-[40px]"
                onClick={() => navigate("/appointments/book")}
              >
                Book Consultation
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.upcomingAppointments.map((apt) => {
                const timeInfo = getAppointmentTimeInfo(
                  apt.scheduled_at,
                  apt.duration_minutes ?? 30,
                  apt.status,
                  false
                );
                return (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 transition-all hover:bg-slate-100/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        Dr. {apt.doctor?.full_name ?? "Doctor"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">
                          {new Date(apt.scheduled_at).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {timeInfo.canJoin ? (
                        <Button
                          variant="action"
                          size="sm"
                          onClick={() => navigate(`/consultation/${apt.id}`)}
                          className="h-8 px-3 text-xs shadow-sm animate-pulse"
                        >
                          Join Call
                        </Button>
                      ) : timeInfo.state === "too_early" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/consultation/${apt.id}`)}
                          className="h-8 px-2.5 text-[11px]"
                        >
                          Waiting Room
                        </Button>
                      ) : (
                        <Badge variant={getAppointmentStatusVariant(apt.status)} size="sm">
                          {apt.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Prescriptions */}
        <div className="rounded-[22px] border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Active Prescriptions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Current medications & dosage
              </p>
            </div>
            <Link
              to="/pharmacy"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Order Refills
            </Link>
          </div>

          {data.activePrescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 p-6">
              <Pill className="mb-2 h-9 w-9 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No active prescriptions
              </p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                When a doctor prescribes medication during consultation, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.activePrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {rx.medications?.[0]?.drug_name ?? "Prescription"}
                    </p>
                    <Badge variant={rx.status === "active" ? "success" : "warning"} size="sm">
                      {rx.status}
                    </Badge>
                  </div>
                  {rx.medications && rx.medications.length > 1 && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      +{rx.medications.length - 1} more medications
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Prescribed by Dr. {rx.doctor?.full_name ?? "Physician"} •{" "}
                    {new Date(rx.issued_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Health Score Breakdown Modal */}
      <HealthScoreModal
        isOpen={showHealthScore}
        onClose={() => setShowHealthScore(false)}
        score={data.healthScore}
        vitals={vitals}
      />
    </div>
  );
};

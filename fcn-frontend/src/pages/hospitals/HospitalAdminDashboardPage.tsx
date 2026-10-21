import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { profileService } from "@/services/profile.service";
import { OccupancyUpdateForm } from "@/components/hospitals/OccupancyUpdateForm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { Building2, Clock, Stethoscope, Users, Bed, Activity, AlertCircle } from "lucide-react";

const HospitalAdminDashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileService.getMyProfile(),
    enabled: !!user && user.role === "hospital_admin",
  });

  const hospitalId = useMemo(() => {
    const profile = profileQuery.data?.data?.profile as any;
    return profile?.hospital_id ?? null;
  }, [profileQuery.data]);

  const hospitalQuery = useQuery({
    queryKey: ["hospitals", hospitalId],
    queryFn: () => profileService.getMyProfile().then((r) => r.data),
    enabled: !!hospitalId,
  });

  const hospital = useMemo(() => {
    const hosp = hospitalQuery.data?.hospital;
    if (!hosp) return null;
    return {
      ...hosp,
      id: hospitalId,
      ...(hospitalQuery.data?.profile as any),
    };
  }, [hospitalQuery.data, hospitalId]);

  const isLoading = profileQuery.isLoading || hospitalQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <SkeletonCard lines={6} />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="mb-4 h-14 w-14 text-fcn-primary/30" />
        <h2 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
          No hospital linked to your administrator profile
        </h2>
        <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 max-w-sm mt-1">
          Please contact system operations to assign your account to an authorized Ethiopian hospital facility.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                Welcome, {user?.full_name?.split(" ")[0] ?? "Admin"}
              </h1>
              <Badge variant="danger" size="sm">Hospital Admin</Badge>
            </div>
            <p className="text-xs sm:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
              Facility Management: <strong>{hospital.name}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Advisory Alert Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-fcn-primary/15 bg-fcn-surface-light dark:bg-fcn-surface-dark p-4 shadow-sm text-xs text-fcn-text-light/80 dark:text-fcn-text-dark/80">
        <AlertCircle className="h-5 w-5 text-fcn-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Shift Routine:</strong> Live emergency and ambulance routing algorithms rely on up-to-date bed availability. Please update occupancy counts at least once per shift (morning and evening shifts).
        </p>
      </div>

      {/* Update Form in Card */}
      <div className="rounded-2xl border border-fcn-primary/10 bg-white dark:bg-fcn-surface-dark p-5 sm:p-6 shadow-sm">
        <OccupancyUpdateForm
          hospitalId={hospitalId!}
          currentData={{
            total_beds: 0,
            occupied_beds: 0,
            occupancy_percent: 0,
            active_doctors_count: 0,
            avg_wait_minutes: 0,
            ...hospital,
          }}
          onSuccess={() => hospitalQuery.refetch()}
        />
      </div>
    </div>
  );
};

export default HospitalAdminDashboardPage;

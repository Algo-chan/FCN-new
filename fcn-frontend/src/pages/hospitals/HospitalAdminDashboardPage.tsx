import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { profileService } from "@/services/profile.service";
import { OccupancyUpdateForm } from "@/components/hospitals/OccupancyUpdateForm";
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { Building2, Clock, Stethoscope, Users } from "lucide-react";

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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
        <SkeletonCard lines={6} />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="mb-4 h-12 w-12 text-fcn-text-light/30" />
        <p className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          No hospital data available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
          Welcome, {user?.full_name?.split(" ")[0] ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          Managing <strong>{hospital.name}</strong>
        </p>
      </div>

      <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-4 text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">
        You can update this data as often as needed — we recommend updating once per shift (morning and evening).
      </div>

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
  );
};

export default HospitalAdminDashboardPage;

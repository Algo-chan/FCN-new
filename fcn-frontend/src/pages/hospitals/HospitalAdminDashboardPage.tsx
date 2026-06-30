import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { hospitalsService } from "@/services/hospitals.service";
import { OccupancyUpdateForm } from "@/components/hospitals/OccupancyUpdateForm";
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { Building2, Clock, Stethoscope, Users } from "lucide-react";

const HospitalAdminDashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  const { data: response, isLoading } = useQuery({
    queryKey: ["hospitals"],
    queryFn: () => hospitalsService.getAllHospitals()
  });

  const hospitals = useMemo(() => response?.data ?? [], [response]);

  const userHospital = useMemo(() => {
    if (!hospitals.length || !user) {
      return null;
    }
    return hospitals[0];
  }, [hospitals, user]);

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

  if (!userHospital) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Building2 className="mb-4 h-12 w-12 text-fcn-text-light/30" />
        <p className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          No hospital data available
        </p>
      </div>
    );
  }

  const freePercent = 100 - userHospital.occupancy_percent;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
          Welcome, {user?.full_name?.split(" ")[0] ?? "Admin"}
        </h1>
        <p className="mt-1 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          Managing <strong>{userHospital.name}</strong>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="text-center">
          <Users className="mx-auto h-5 w-5 text-fcn-primary" />
          <p className="mt-2 text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            {userHospital.total_beds}
          </p>
          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Total Beds</p>
        </Card>
        <Card className="text-center">
          <Users className="mx-auto h-5 w-5 text-fcn-warning" />
          <p className="mt-2 text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            {userHospital.occupied_beds}
          </p>
          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Occupied Beds</p>
        </Card>
        <Card className="text-center">
          <Building2 className="mx-auto h-5 w-5 text-fcn-accent" />
          <p className="mt-2 text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            {userHospital.occupancy_percent}%
          </p>
          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Occupancy</p>
        </Card>
        <Card className="text-center">
          <Stethoscope className="mx-auto h-5 w-5 text-fcn-primary" />
          <p className="mt-2 text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            {userHospital.active_doctors_count}
          </p>
          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Active Doctors</p>
        </Card>
        <Card className="text-center">
          <Clock className="mx-auto h-5 w-5 text-fcn-warning" />
          <p className="mt-2 text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
            ~{userHospital.avg_wait_minutes}
          </p>
          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">Avg Wait (min)</p>
        </Card>
      </div>

      <div className="rounded-lg border border-fcn-primary/10 bg-fcn-primary/5 p-4 text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70">
        You can update this data as often as needed — we recommend updating once per shift (morning and evening).
      </div>

      <OccupancyUpdateForm
        hospitalId={userHospital.id}
        currentData={userHospital}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};

export default HospitalAdminDashboardPage;

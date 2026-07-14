import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import {
  getAnalyticsOverview, getConsultationsTrend, getRegistrationsTrend,
  getTopDoctors,
} from "@/services/admin.service";
import { AnalyticsOverviewCards } from "@/components/admin/AnalyticsOverviewCards";
import { ConsultationsTrendChart } from "@/components/admin/ConsultationsTrendChart";
import { RegistrationsTrendChart } from "@/components/admin/RegistrationsTrendChart";
import { TopDoctorsTable } from "@/components/admin/TopDoctorsTable";

const AdminPanelPage = () => {
  const user = useAuthStore((s) => s.user);
  const [consultationsDays, setConsultationsDays] = useState(30);

  const { data: overviewData } = useQuery({
    queryKey: ["admin-analytics", "overview"],
    queryFn: () => getAnalyticsOverview(),
  });

  const { data: consultationsData, isFetching: consultationsLoading } = useQuery({
    queryKey: ["admin-analytics", "consultations", consultationsDays],
    queryFn: () => getConsultationsTrend(consultationsDays),
  });

  const { data: registrationsData, isFetching: registrationsLoading } = useQuery({
    queryKey: ["admin-analytics", "registrations", 12],
    queryFn: () => getRegistrationsTrend(12),
  });

  const { data: topDoctorsData, isFetching: topDocsLoading } = useQuery({
    queryKey: ["admin-analytics", "top-doctors"],
    queryFn: () => getTopDoctors(10),
  });

  const overview = overviewData?.data;
  const consultations = consultationsData?.data ?? [];
  const registrations = registrationsData?.data ?? [];
  const topDoctors = topDoctorsData?.data ?? [];

  const handleConsultationsDaysChange = useCallback((days: number) => {
    setConsultationsDays(days);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <img src="/logo/fcn-logo-full.png" alt="FCN" className="h-7 w-auto" />
          <h1 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Admin Panel</h1>
        </div>
        <p className="text-xs text-fcn-text-light/40">Foundation Care Network Control Center</p>
        <p className="mt-1 text-xs text-fcn-text-light/40">
          Logged in as <span className="font-medium text-fcn-text-light dark:text-fcn-text-dark">{user?.full_name || "Admin"}</span>
        </p>
      </div>

      {overview && <AnalyticsOverviewCards overview={overview} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ConsultationsTrendChart
            data={consultations}
            loading={consultationsLoading}
            onDaysChange={handleConsultationsDaysChange}
          />
        </div>
        <div className="lg:col-span-2">
          <RegistrationsTrendChart data={registrations} loading={registrationsLoading} />
        </div>
      </div>

      <TopDoctorsTable data={topDoctors} loading={topDocsLoading} />
    </div>
  );
};

export default AdminPanelPage;

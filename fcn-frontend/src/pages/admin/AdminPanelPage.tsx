import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { Shield, Sparkles, TrendingUp, Users, Calendar, Activity } from "lucide-react";
import {
  getAnalyticsOverview, getConsultationsTrend, getRegistrationsTrend,
  getTopDoctors,
} from "@/services/admin.service";
import { AnalyticsOverviewCards } from "@/components/admin/AnalyticsOverviewCards";
import { ConsultationsTrendChart } from "@/components/admin/ConsultationsTrendChart";
import { RegistrationsTrendChart } from "@/components/admin/RegistrationsTrendChart";
import { TopDoctorsTable } from "@/components/admin/TopDoctorsTable";
import { PageHeader } from "@/components/ui/PageHeader";

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
    <div className="mx-auto max-w-7xl space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-600/20">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              Operations & Analytics Center
            </h1>
            <p className="text-xs sm:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60 mt-0.5">
              National healthcare metrics, telemedicine throughput, and provider performance
            </p>
          </div>
        </div>

        <div className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 self-start sm:self-auto">
          Logged in as <strong className="text-fcn-text-light dark:text-fcn-text-dark">{user?.full_name || "Super Admin"}</strong>
        </div>
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

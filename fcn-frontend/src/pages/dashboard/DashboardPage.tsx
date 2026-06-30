import { useAuthStore } from "@/store/auth.store";
import { PatientDashboard } from "@/components/dashboard/PatientDashboard";
import { DoctorDashboard } from "@/components/dashboard/DoctorDashboard";
import { NurseDashboard } from "@/components/dashboard/NurseDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  switch (user.role) {
    case "patient":
      return <PatientDashboard />;
    case "doctor":
      return <DoctorDashboard />;
    case "nurse":
    case "rural_health_officer":
      return <NurseDashboard />;
    case "super_admin":
      return <AdminDashboard />;
    default:
      return <PatientDashboard />;
  }
};

export default DashboardPage;

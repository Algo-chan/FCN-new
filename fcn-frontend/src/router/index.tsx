import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import AdminPanelPage from "@/pages/admin/AdminPanelPage";
import AISymptomCheckPage from "@/pages/ai-check/AISymptomCheckPage";
import BookAppointmentPage from "@/pages/appointments/BookAppointmentPage";
import MyAppointmentsPage from "@/pages/appointments/MyAppointmentsPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ConsultationPage from "@/pages/consultation/ConsultationPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import FindDoctorsPage from "@/pages/doctors/FindDoctorsPage";
import HealthRecordsPage from "@/pages/health-records/HealthRecordsPage";
import NurseHealthRecordsPage from "@/pages/health-records/NurseHealthRecordsPage";
import PatientRecordsViewPage from "@/pages/health-records/PatientRecordsViewPage";
import HospitalCheckerPage from "@/pages/hospitals/HospitalCheckerPage";
import LandingPage from "@/pages/LandingPage";
import NotificationsPage from "@/pages/notifications/NotificationsPage";
import PharmacyPage from "@/pages/pharmacy/PharmacyPage";
import DoctorPrescriptionsPage from "@/pages/pharmacy/DoctorPrescriptionsPage";
import PharmacyAdminPortalPage from "@/pages/pharmacy/PharmacyAdminPortalPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import { DoctorPublicProfilePage } from "@/components/profile/DoctorPublicProfilePage";
import { PageScaffold } from "@/pages/PageScaffold";
import OnboardingPage from "@/pages/auth/OnboardingPage";
import PendingApprovalPage from "@/pages/auth/PendingApprovalPage";
import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect pending doctors/nurses away from non-pending pages
  if (user && (user.role === "doctor" || user.role === "nurse" || user.role === "rural_health_officer") && user.status === "pending") {
    const path = window.location.pathname;
    if (path !== "/pending") {
      return <Navigate to="/pending" replace />;
    }
  }

  // Redirect patients who haven't completed onboarding
  if (user && user.role === "patient" && !onboardingCompleted) {
    const path = window.location.pathname;
    if (path !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
};

const AdminRoute = () => <ProtectedRoute allowedRoles={["super_admin"]} />;

const DoctorDashboardPage = () => <Navigate to="/dashboard" replace />;

const DoctorDetailsPage = () => {
  const { id } = useParams();
  return <PageScaffold title={`Doctor Details Page${id ? ` - ${id}` : ""}`} />;
};

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    <Route path="/onboarding" element={<OnboardingPage />} />
    <Route path="/pending" element={<PendingApprovalPage />} />
    <Route path="/doctors/:doctorId" element={<DoctorPublicProfilePage />} />

    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/hospitals" element={<HospitalCheckerPage />} />
      <Route path="/doctors" element={<FindDoctorsPage />} />
      <Route path="/doctors/:id/details" element={<DoctorDetailsPage />} />
      <Route path="/appointments/book" element={<BookAppointmentPage />} />
      <Route path="/appointments" element={<MyAppointmentsPage />} />
      <Route path="/consultation/:appointmentId" element={<ConsultationPage />} />
      <Route path="/health-records" element={<HealthRecordsPage />} />
      <Route path="/health-records/nurse" element={<NurseHealthRecordsPage />} />
      <Route path="/health-records/patient/:patientId" element={<HealthRecordsPage />} />
      <Route path="/health-records/patient/:patientId/view" element={<PatientRecordsViewPage />} />
      <Route path="/ai-check" element={<AISymptomCheckPage />} />
      <Route path="/pharmacy" element={<PharmacyPage />} />
      <Route path="/pharmacy-admin" element={<PharmacyAdminPortalPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route>

    <Route element={<AdminRoute />}>
      <Route path="/admin" element={<AdminPanelPage />} />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
      <Route path="/doctor-dashboard" element={<DoctorDashboardPage />} />
      <Route path="/prescriptions" element={<DoctorPrescriptionsPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

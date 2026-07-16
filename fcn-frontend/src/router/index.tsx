import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import AdminPanelPage from "@/pages/admin/AdminPanelPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminHospitalsPage from "@/pages/admin/AdminHospitalsPage";
import AdminPharmaciesPage from "@/pages/admin/AdminPharmaciesPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminLogsPage from "@/pages/admin/AdminLogsPage";
import AISymptomCheckPage from "@/pages/ai-check/AISymptomCheckPage";
import BookAppointmentPage from "@/pages/appointments/BookAppointmentPage";
import MyAppointmentsPage from "@/pages/appointments/MyAppointmentsPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import AuthCallbackPage from "@/pages/auth/AuthCallbackPage";
import ConsultationPage from "@/pages/consultation/ConsultationPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import FindDoctorsPage from "@/pages/doctors/FindDoctorsPage";
import HealthRecordsPage from "@/pages/health-records/HealthRecordsPage";
import NurseHealthRecordsPage from "@/pages/health-records/NurseHealthRecordsPage";
import PatientRecordsViewPage from "@/pages/health-records/PatientRecordsViewPage";
import HospitalCheckerPage from "@/pages/hospitals/HospitalCheckerPage";
import HospitalAdminDashboardPage from "@/pages/hospitals/HospitalAdminDashboardPage";
import HospitalOccupancyPage from "@/pages/hospital-admin/HospitalOccupancyPage";
import HospitalDoctorsPage from "@/pages/hospital-admin/HospitalDoctorsPage";
import LandingPage from "@/pages/LandingPage";
import NotFoundPage from "@/pages/NotFoundPage";
import NotificationsPage from "@/pages/notifications/NotificationsPage";
import PharmacyPage from "@/pages/pharmacy/PharmacyPage";
import PharmacyAdminPortalPage from "@/pages/pharmacy/PharmacyAdminPortalPage";
import PharmacyVerifyPage from "@/pages/pharmacy-admin/PharmacyVerifyPage";
import PharmacyDispenseHistoryPage from "@/pages/pharmacy-admin/PharmacyDispenseHistoryPage";
import ProfilePage from "@/pages/profile/ProfilePage";
import { DoctorPublicProfilePage } from "@/components/profile/DoctorPublicProfilePage";
import { PageScaffold } from "@/pages/PageScaffold";
import OnboardingPage from "@/pages/auth/OnboardingPage";
import PendingApprovalPage from "@/pages/auth/PendingApprovalPage";
import DoctorSchedulePage from "@/pages/doctor/DoctorSchedulePage";
import DoctorPatientsPage from "@/pages/doctor/DoctorPatientsPage";
import DoctorPrescriptionsListPage from "@/pages/doctor/DoctorPrescriptionsListPage";
import NurseTodayVisitsPage from "@/pages/nurse/NurseTodayVisitsPage";
import NursePatientsPage from "@/pages/nurse/NursePatientsPage";
import NurseHistoryPage from "@/pages/nurse/NurseHistoryPage";
import NurseEscalationPage from "@/pages/nurse/NurseEscalationPage";
import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types";

function getRoleDashboard(role: Role): string {
  switch (role) {
    case "hospital_admin":
      return "/hospital-admin";
    case "pharmacy_admin":
      return "/pharmacy-admin";
    case "super_admin":
      return "/admin";
    default:
      return "/dashboard";
  }
}

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const location = useLocation();

  if (!isAuthenticated && isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  if (user && (user.role === "doctor" || user.role === "nurse" || user.role === "rural_health_officer") && user.status === "pending") {
    if (location.pathname !== "/pending") {
      return <Navigate to="/pending" replace />;
    }
  }

  if (user && user.role === "patient" && !onboardingCompleted) {
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
};

const PatientRoute = () => <ProtectedRoute allowedRoles={["patient"]} />;
const DoctorRoute = () => <ProtectedRoute allowedRoles={["doctor"]} />;
const NurseRoute = () => <ProtectedRoute allowedRoles={["nurse", "rural_health_officer"]} />;
const HospitalAdminRoute = () => <ProtectedRoute allowedRoles={["hospital_admin"]} />;
const PharmacyAdminRoute = () => <ProtectedRoute allowedRoles={["pharmacy_admin"]} />;
const SuperAdminRoute = () => <ProtectedRoute allowedRoles={["super_admin"]} />;

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />

    <Route path="/onboarding" element={<OnboardingPage />} />
    <Route path="/pending" element={<PendingApprovalPage />} />
    <Route path="/doctors/:doctorId" element={<DoctorPublicProfilePage />} />

    {/* ── Shared authenticated routes ─────────────────────────── */}
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/hospitals" element={<HospitalCheckerPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route>

    {/* ── Patient-only routes ─────────────────────────────────── */}
    <Route element={<PatientRoute />}>
      <Route path="/doctors" element={<FindDoctorsPage />} />
      <Route path="/doctors/:id/details" element={<PageScaffold title="Doctor Details" section="Doctor" />} />
      <Route path="/appointments/book" element={<BookAppointmentPage />} />
      <Route path="/appointments" element={<MyAppointmentsPage />} />
      <Route path="/consultation/:appointmentId" element={<ConsultationPage />} />
      <Route path="/health-records" element={<HealthRecordsPage />} />
      <Route path="/health-records/patient/:patientId" element={<HealthRecordsPage />} />
      <Route path="/health-records/patient/:patientId/view" element={<PatientRecordsViewPage />} />
      <Route path="/ai-check" element={<AISymptomCheckPage />} />
      <Route path="/pharmacy" element={<PharmacyPage />} />
    </Route>

    {/* ── Doctor-only routes ──────────────────────────────────── */}
    <Route element={<DoctorRoute />}>
      <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
      <Route path="/appointments" element={<MyAppointmentsPage />} />
      <Route path="/consultation" element={<ConsultationPage />} />
      <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
      <Route path="/doctor/patients/:patientId" element={<PatientRecordsViewPage />} />
      <Route path="/doctor/prescriptions" element={<DoctorPrescriptionsListPage />} />
    </Route>

    {/* ── Nurse / Rural Health Officer routes ─────────────────── */}
    <Route element={<NurseRoute />}>
      <Route path="/nurse/today" element={<NurseTodayVisitsPage />} />
      <Route path="/nurse/patients" element={<NursePatientsPage />} />
      <Route path="/nurse/history" element={<NurseHistoryPage />} />
      <Route path="/nurse/escalation" element={<NurseEscalationPage />} />
      <Route path="/health-records" element={<HealthRecordsPage />} />
      <Route path="/health-records/nurse" element={<NurseHealthRecordsPage />} />
      <Route path="/health-records/patient/:patientId/view" element={<PatientRecordsViewPage />} />
    </Route>

    {/* ── Hospital Admin routes ───────────────────────────────── */}
    <Route element={<HospitalAdminRoute />}>
      <Route path="/hospital-admin" element={<HospitalAdminDashboardPage />} />
      <Route path="/hospital-admin/occupancy" element={<HospitalOccupancyPage />} />
      <Route path="/hospital-admin/doctors" element={<HospitalDoctorsPage />} />
    </Route>

    {/* ── Pharmacy Admin routes ───────────────────────────────── */}
    <Route element={<PharmacyAdminRoute />}>
      <Route path="/pharmacy-admin" element={<PharmacyAdminPortalPage />} />
      <Route path="/pharmacy-admin/verify" element={<PharmacyVerifyPage />} />
      <Route path="/pharmacy-admin/history" element={<PharmacyDispenseHistoryPage />} />
    </Route>

    {/* ── Super Admin routes ──────────────────────────────────── */}
    <Route element={<SuperAdminRoute />}>
      <Route path="/admin" element={<AdminPanelPage />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/hospitals" element={<AdminHospitalsPage />} />
      <Route path="/admin/pharmacies" element={<AdminPharmaciesPage />} />
      <Route path="/admin/settings" element={<AdminSettingsPage />} />
      <Route path="/admin/logs" element={<AdminLogsPage />} />
    </Route>

    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

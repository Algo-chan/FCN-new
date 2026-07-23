import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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

const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }
};

const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
  const shouldReduceMotion = useReducedMotion();
  return shouldReduceMotion ? (
    <>{children}</>
  ) : (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  );
};

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

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><RegisterPage /></AnimatedPage>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="/onboarding" element={<AnimatedPage><OnboardingPage /></AnimatedPage>} />
        <Route path="/pending" element={<AnimatedPage><PendingApprovalPage /></AnimatedPage>} />
        <Route path="/doctors/:doctorId" element={<AnimatedPage><DoctorPublicProfilePage /></AnimatedPage>} />

        {/* ── Shared authenticated routes ─────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
          <Route path="/hospitals" element={<AnimatedPage><HospitalCheckerPage /></AnimatedPage>} />
          <Route path="/notifications" element={<AnimatedPage><NotificationsPage /></AnimatedPage>} />
          <Route path="/profile" element={<AnimatedPage><ProfilePage /></AnimatedPage>} />
        </Route>

        {/* ── Patient-only routes ─────────────────────────────────── */}
        <Route element={<PatientRoute />}>
          <Route path="/doctors" element={<AnimatedPage><FindDoctorsPage /></AnimatedPage>} />
          <Route path="/doctors/:id/details" element={<AnimatedPage><PageScaffold title="Doctor Details" section="Doctor" /></AnimatedPage>} />
          <Route path="/appointments/book" element={<AnimatedPage><BookAppointmentPage /></AnimatedPage>} />
          <Route path="/appointments" element={<AnimatedPage><MyAppointmentsPage /></AnimatedPage>} />
          <Route path="/consultation/:appointmentId" element={<AnimatedPage><ConsultationPage /></AnimatedPage>} />
          <Route path="/health-records" element={<AnimatedPage><HealthRecordsPage /></AnimatedPage>} />
          <Route path="/health-records/patient/:patientId" element={<AnimatedPage><HealthRecordsPage /></AnimatedPage>} />
          <Route path="/health-records/patient/:patientId/view" element={<AnimatedPage><PatientRecordsViewPage /></AnimatedPage>} />
          <Route path="/ai-check" element={<AnimatedPage><AISymptomCheckPage /></AnimatedPage>} />
          <Route path="/pharmacy" element={<AnimatedPage><PharmacyPage /></AnimatedPage>} />
        </Route>

        {/* ── Doctor-only routes ──────────────────────────────────── */}
        <Route element={<DoctorRoute />}>
          <Route path="/doctor/schedule" element={<AnimatedPage><DoctorSchedulePage /></AnimatedPage>} />
          <Route path="/appointments" element={<AnimatedPage><MyAppointmentsPage /></AnimatedPage>} />
          <Route path="/consultation" element={<AnimatedPage><ConsultationPage /></AnimatedPage>} />
          <Route path="/doctor/patients" element={<AnimatedPage><DoctorPatientsPage /></AnimatedPage>} />
          <Route path="/doctor/patients/:patientId" element={<AnimatedPage><PatientRecordsViewPage /></AnimatedPage>} />
          <Route path="/doctor/prescriptions" element={<AnimatedPage><DoctorPrescriptionsListPage /></AnimatedPage>} />
        </Route>

        {/* ── Nurse / Rural Health Officer routes ─────────────────── */}
        <Route element={<NurseRoute />}>
          <Route path="/nurse/today" element={<AnimatedPage><NurseTodayVisitsPage /></AnimatedPage>} />
          <Route path="/nurse/patients" element={<AnimatedPage><NursePatientsPage /></AnimatedPage>} />
          <Route path="/nurse/history" element={<AnimatedPage><NurseHistoryPage /></AnimatedPage>} />
          <Route path="/nurse/escalation" element={<AnimatedPage><NurseEscalationPage /></AnimatedPage>} />
          <Route path="/health-records" element={<AnimatedPage><HealthRecordsPage /></AnimatedPage>} />
          <Route path="/health-records/nurse" element={<AnimatedPage><NurseHealthRecordsPage /></AnimatedPage>} />
          <Route path="/health-records/patient/:patientId/view" element={<AnimatedPage><PatientRecordsViewPage /></AnimatedPage>} />
        </Route>

        {/* ── Hospital Admin routes ───────────────────────────────── */}
        <Route element={<HospitalAdminRoute />}>
          <Route path="/hospital-admin" element={<AnimatedPage><HospitalAdminDashboardPage /></AnimatedPage>} />
          <Route path="/hospital-admin/occupancy" element={<AnimatedPage><HospitalOccupancyPage /></AnimatedPage>} />
          <Route path="/hospital-admin/doctors" element={<AnimatedPage><HospitalDoctorsPage /></AnimatedPage>} />
        </Route>

        {/* ── Pharmacy Admin routes ───────────────────────────────── */}
        <Route element={<PharmacyAdminRoute />}>
          <Route path="/pharmacy-admin" element={<AnimatedPage><PharmacyAdminPortalPage /></AnimatedPage>} />
          <Route path="/pharmacy-admin/verify" element={<AnimatedPage><PharmacyVerifyPage /></AnimatedPage>} />
          <Route path="/pharmacy-admin/history" element={<AnimatedPage><PharmacyDispenseHistoryPage /></AnimatedPage>} />
        </Route>

        {/* ── Super Admin routes ──────────────────────────────────── */}
        <Route element={<SuperAdminRoute />}>
          <Route path="/admin" element={<AnimatedPage><AdminPanelPage /></AnimatedPage>} />
          <Route path="/admin/users" element={<AnimatedPage><AdminUsersPage /></AnimatedPage>} />
          <Route path="/admin/hospitals" element={<AnimatedPage><AdminHospitalsPage /></AnimatedPage>} />
          <Route path="/admin/pharmacies" element={<AnimatedPage><AdminPharmaciesPage /></AnimatedPage>} />
          <Route path="/admin/settings" element={<AnimatedPage><AdminSettingsPage /></AnimatedPage>} />
          <Route path="/admin/logs" element={<AnimatedPage><AdminLogsPage /></AnimatedPage>} />
        </Route>

        <Route path="*" element={<AnimatedPage><NotFoundPage /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
};

export const AppRouter = () => (
  <AnimatedRoutes />
);

import { NavLink } from "react-router-dom";
import {
  Home,
  CalendarCheck,
  Sparkles,
  Stethoscope,
  Calendar,
  MapPin,
  Users,
  Bell,
  Activity,
  QrCode,
  ClipboardList,
  Building2,
  Pill,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/hooks/useNotifications";
import { clsx } from "clsx";
import type { Role } from "@/types";

interface BottomNavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: boolean;
}

const PATIENT_TABS: BottomNavItem[] = [
  { label: "Home", path: "/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Doctors", path: "/doctors", icon: <Stethoscope className="h-5 w-5" /> },
  { label: "Appts", path: "/appointments", icon: <CalendarCheck className="h-5 w-5" /> },
  { label: "AI Check", path: "/ai-check", icon: <Sparkles className="h-5 w-5" /> },
  { label: "Notifs", path: "/notifications", icon: <Bell className="h-5 w-5" />, badge: true },
];

const DOCTOR_TABS: BottomNavItem[] = [
  { label: "Home", path: "/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Schedule", path: "/doctor/schedule", icon: <Calendar className="h-5 w-5" /> },
  { label: "Patients", path: "/doctor/patients", icon: <Users className="h-5 w-5" /> },
  { label: "Rx", path: "/doctor/prescriptions", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "Notifs", path: "/notifications", icon: <Bell className="h-5 w-5" />, badge: true },
];

const NURSE_TABS: BottomNavItem[] = [
  { label: "Home", path: "/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Visits", path: "/nurse/today", icon: <MapPin className="h-5 w-5" /> },
  { label: "Patients", path: "/nurse/patients", icon: <Users className="h-5 w-5" /> },
  { label: "History", path: "/nurse/history", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "Notifs", path: "/notifications", icon: <Bell className="h-5 w-5" />, badge: true },
];

const HOSPITAL_ADMIN_TABS: BottomNavItem[] = [
  { label: "Home", path: "/hospital-admin", icon: <Home className="h-5 w-5" /> },
  { label: "Beds", path: "/hospital-admin/occupancy", icon: <Activity className="h-5 w-5" /> },
  { label: "Doctors", path: "/hospital-admin/doctors", icon: <Stethoscope className="h-5 w-5" /> },
  { label: "Hospitals", path: "/hospitals", icon: <Building2 className="h-5 w-5" /> },
  { label: "Notifs", path: "/notifications", icon: <Bell className="h-5 w-5" />, badge: true },
];

const PHARMACY_ADMIN_TABS: BottomNavItem[] = [
  { label: "Home", path: "/pharmacy-admin", icon: <Home className="h-5 w-5" /> },
  { label: "Verify", path: "/pharmacy-admin/verify", icon: <QrCode className="h-5 w-5" /> },
  { label: "History", path: "/pharmacy-admin/history", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "Catalog", path: "/pharmacy", icon: <Pill className="h-5 w-5" /> },
  { label: "Notifs", path: "/notifications", icon: <Bell className="h-5 w-5" />, badge: true },
];

const SUPER_ADMIN_TABS: BottomNavItem[] = [
  { label: "Admin", path: "/admin", icon: <Home className="h-5 w-5" /> },
  { label: "Users", path: "/admin/users", icon: <Users className="h-5 w-5" /> },
  { label: "Hospitals", path: "/admin/hospitals", icon: <Building2 className="h-5 w-5" /> },
  { label: "Pharmacy", path: "/admin/pharmacies", icon: <Pill className="h-5 w-5" /> },
  { label: "Notifs", path: "/notifications", icon: <Bell className="h-5 w-5" />, badge: true },
];

const ROLE_TABS: Record<Role, BottomNavItem[]> = {
  patient: PATIENT_TABS,
  doctor: DOCTOR_TABS,
  nurse: NURSE_TABS,
  rural_health_officer: NURSE_TABS,
  hospital_admin: HOSPITAL_ADMIN_TABS,
  pharmacy_admin: PHARMACY_ADMIN_TABS,
  super_admin: SUPER_ADMIN_TABS,
};

/**
 * Mobile-First Bottom Navigation Bar
 * Implements Mobile Style Reference Pattern #1:
 * Bottom tab bar (4-5 items, active tab filled and colored with a small label),
 * respecting safe-area insets, with 48px+ touch targets and active scale feedback.
 * Profile has been placed in TopBar account dropdown, and Notifications is now
 * prominently available in the bottom tab bar with live unread badge counters.
 */
export const BottomNavBar = () => {
  const user = useAuthStore((state) => state.user);
  const { unreadCount } = useNotifications();

  const tabs = (user?.role ? ROLE_TABS[user.role] : null) ?? PATIENT_TABS;

  return (
    <nav
      role="navigation"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-md px-1.5 pb-[max(8px,env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-slate-900/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="flex h-16 items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={
              tab.path === "/dashboard" ||
              tab.path === "/hospital-admin" ||
              tab.path === "/pharmacy-admin" ||
              tab.path === "/admin"
            }
            className={({ isActive }) =>
              clsx(
                "group relative flex flex-1 flex-col items-center justify-center min-h-[48px] py-1 select-none transition-all duration-200 active:scale-95",
                isActive
                  ? "text-teal-600 dark:text-teal-400 font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium"
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active Filled Pill */}
                <div
                  className={clsx(
                    "relative flex items-center justify-center px-4 py-1 rounded-full transition-all duration-200",
                    isActive
                      ? "bg-teal-500/15 dark:bg-teal-400/20 text-teal-600 dark:text-teal-400 shadow-[0_2px_10px_rgba(20,184,166,0.2)]"
                      : "bg-transparent text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-white/5"
                  )}
                >
                  {tab.icon}

                  {/* Notification Badge */}
                  {tab.badge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black leading-none text-white shadow-[0_2px_6px_rgba(244,63,94,0.4)]">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>

                <span
                  className={clsx(
                    "text-[11px] mt-0.5 tracking-tight transition-colors",
                    isActive
                      ? "font-bold text-teal-700 dark:text-teal-300"
                      : "text-slate-500 dark:text-slate-400 font-medium"
                  )}
                >
                  {tab.label}
                </span>

                {/* Micro Active Dot Indicator */}
                {isActive && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-teal-500 dark:bg-teal-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

import { NavLink } from "react-router-dom";
import { Home, CalendarCheck, MessageCircle, Bell, User, Calendar, MapPin, Users } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/hooks/useNotifications";
import { clsx } from "clsx";

interface BottomNavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const PATIENT_TABS: BottomNavItem[] = [
  { label: "Home", path: "/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Appts", path: "/appointments", icon: <CalendarCheck className="h-5 w-5" /> },
  { label: "Chat", path: "/consultation", icon: <MessageCircle className="h-5 w-5" /> },
  { label: "Notifs", path: "/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: "Profile", path: "/profile", icon: <User className="h-5 w-5" /> },
];

const DOCTOR_TABS: BottomNavItem[] = [
  { label: "Home", path: "/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Schedule", path: "/doctor/schedule", icon: <Calendar className="h-5 w-5" /> },
  { label: "Chat", path: "/consultation", icon: <MessageCircle className="h-5 w-5" /> },
  { label: "Notifs", path: "/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: "Profile", path: "/profile", icon: <User className="h-5 w-5" /> },
];

const NURSE_TABS: BottomNavItem[] = [
  { label: "Home", path: "/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Visits", path: "/nurse/today", icon: <MapPin className="h-5 w-5" /> },
  { label: "Patients", path: "/nurse/patients", icon: <Users className="h-5 w-5" /> },
  { label: "Notifs", path: "/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: "Profile", path: "/profile", icon: <User className="h-5 w-5" /> },
];

const ROLE_TABS: Record<string, BottomNavItem[]> = {
  patient: PATIENT_TABS,
  doctor: DOCTOR_TABS,
  nurse: NURSE_TABS,
  rural_health_officer: NURSE_TABS,
};

export const BottomNavBar = () => {
  const user = useAuthStore((state) => state.user);
  const { unreadCount } = useNotifications();

  const tabs = ROLE_TABS[user?.role ?? "patient"] ?? PATIENT_TABS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#1E293B] px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-[60px] items-center justify-around">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === "/dashboard"}
            className={({ isActive }) =>
              clsx(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-1",
                isActive ? "text-[#0A7EA4]" : "text-[#64748B]"
              )
            }
          >
            <div className="relative">
              {tab.icon}
              {tab.label === "Notifs" && unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-[#F87171] px-1 text-[9px] font-bold leading-tight text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

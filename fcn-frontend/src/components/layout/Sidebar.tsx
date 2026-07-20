import { useCallback, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  ArrowUpCircle,
  Building2,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  HeartPulse,
  Home,
  Inbox,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Pill,
  QrCode,
  Settings,
  Sparkles,
  Stethoscope,
  Users,
  User,
  Bell,
  X
} from "lucide-react";
import { clsx } from "clsx";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useWindowSize } from "@/hooks/useWindowSize";
import type { Role } from "@/types";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Home: <Home className="h-5 w-5" />,
  Stethoscope: <Stethoscope className="h-5 w-5" />,
  CalendarPlus: <CalendarPlus className="h-5 w-5" />,
  CalendarCheck: <CalendarCheck className="h-5 w-5" />,
  HeartPulse: <HeartPulse className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  MessageCircle: <MessageCircle className="h-5 w-5" />,
  Pill: <Pill className="h-5 w-5" />,
  Bell: <Bell className="h-5 w-5" />,
  User: <User className="h-5 w-5" />,
  Calendar: <Calendar className="h-5 w-5" />,
  Inbox: <Inbox className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  MapPin: <MapPin className="h-5 w-5" />,
  Clock: <Clock className="h-5 w-5" />,
  ArrowUpCircle: <ArrowUpCircle className="h-5 w-5" />,
  Activity: <Activity className="h-5 w-5" />,
  Building2: <Building2 className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  ClipboardList: <ClipboardList className="h-5 w-5" />,
  QrCode: <QrCode className="h-5 w-5" />,
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
};

const NAV_CONFIG: Record<Role, NavGroup[]> = {
  patient: [
    {
      group: "MAIN",
      items: [
        { label: "Dashboard", icon: "Home", path: "/dashboard" },
        { label: "Hospitals", icon: "Building2", path: "/hospitals" },
        { label: "Find Doctors", icon: "Stethoscope", path: "/doctors" },
        { label: "Book Appointment", icon: "CalendarPlus", path: "/appointments/book" },
        { label: "My Appointments", icon: "CalendarCheck", path: "/appointments" },
      ]
    },
    {
      group: "HEALTH",
      items: [
        { label: "Health Records", icon: "HeartPulse", path: "/health-records" },
        { label: "AI Health Check", icon: "Sparkles", path: "/ai-check" },
      ]
    },
    {
      group: "SERVICES",
      items: [
        { label: "Consultation", icon: "MessageCircle", path: "/consultation" },
        { label: "Pharmacy & Rx", icon: "Pill", path: "/pharmacy" },
      ]
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ]
    }
  ],

  doctor: [
    {
      group: "MAIN",
      items: [
        { label: "Dashboard", icon: "Home", path: "/dashboard" },
        { label: "My Schedule", icon: "Calendar", path: "/doctor/schedule" },
        { label: "Appointment Requests", icon: "Inbox", path: "/appointments" },
        { label: "Consultations", icon: "MessageCircle", path: "/consultation" },
      ]
    },
    {
      group: "PATIENTS",
      items: [
        { label: "My Patients", icon: "Users", path: "/doctor/patients" },
        { label: "Prescriptions Issued", icon: "FileText", path: "/doctor/prescriptions" },
      ]
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ]
    }
  ],

  nurse: [
    {
      group: "MAIN",
      items: [
        { label: "Dashboard", icon: "Home", path: "/dashboard" },
        { label: "Today's Visits", icon: "MapPin", path: "/nurse/today" },
        { label: "My Patients", icon: "Users", path: "/nurse/patients" },
        { label: "Visit History", icon: "Clock", path: "/nurse/history" },
      ]
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ]
    }
  ],

  rural_health_officer: [
    {
      group: "MAIN",
      items: [
        { label: "Dashboard", icon: "Home", path: "/dashboard" },
        { label: "Today's Cases", icon: "MapPin", path: "/nurse/today" },
        { label: "My Patients", icon: "Users", path: "/nurse/patients" },
        { label: "Specialist Escalation", icon: "ArrowUpCircle", path: "/nurse/escalation" },
        { label: "Visit History", icon: "Clock", path: "/nurse/history" },
      ]
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ]
    }
  ],

  hospital_admin: [
    {
      group: "MY HOSPITAL",
      items: [
        { label: "Dashboard", icon: "Home", path: "/hospital-admin" },
        { label: "Update Occupancy", icon: "Activity", path: "/hospital-admin/occupancy" },
        { label: "My Doctors", icon: "Stethoscope", path: "/hospital-admin/doctors" },
      ]
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ]
    }
  ],

  pharmacy_admin: [
    {
      group: "PHARMACY",
      items: [
        { label: "Dashboard", icon: "Home", path: "/pharmacy-admin" },
        { label: "Verify Prescription", icon: "QrCode", path: "/pharmacy-admin/verify" },
        { label: "Dispense History", icon: "ClipboardList", path: "/pharmacy-admin/history" },
      ]
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ]
    }
  ],

  super_admin: [
    {
      group: "ADMIN PANEL",
      items: [
        { label: "Overview", icon: "LayoutDashboard", path: "/admin" },
        { label: "Users", icon: "Users", path: "/admin/users" },
        { label: "Hospitals", icon: "Building2", path: "/admin/hospitals" },
        { label: "Pharmacies", icon: "Pill", path: "/admin/pharmacies" },
        { label: "Settings", icon: "Settings", path: "/admin/settings" },
        { label: "Activity Logs", icon: "ClipboardList", path: "/admin/logs" },
      ]
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ]
    }
  ],
};

export const Sidebar = () => {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const setSidebar = useUiStore((state) => state.setSidebar);
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowSize();
  const isMobile = width < 1024;

  const navGroups = useMemo(() => {
    return NAV_CONFIG[user?.role ?? "patient"] ?? NAV_CONFIG.patient;
  }, [user?.role]);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  const handleNavClick = useCallback(() => {
    if (isMobile) {
      setSidebar(false);
    }
  }, [isMobile, setSidebar]);

  if (!sidebarOpen) {
    return null;
  }

  const sidebarContent = (
    <aside
      className={clsx(
        "flex h-full flex-col border-r border-fcn-primary/10 bg-white dark:bg-fcn-dark",
        isMobile
          ? "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300"
          : "fixed inset-y-0 left-0 z-40 transition-all duration-300",
        isMobile ? "translate-x-0" : sidebarCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-fcn-primary/10 px-4">
        {!sidebarCollapsed || isMobile ? (
          <img
            src="/logo/fcn-logo-full.png"
            alt="FCN Logo"
            className="h-8 w-auto"
          />
        ) : (
          <img
            src="/logo/fcn-logo-full.png"
            alt="FCN Logo"
            className="mx-auto h-8 w-auto"
          />
        )}
        {isMobile ? (
          <button
            onClick={() => setSidebar(false)}
            className="rounded-md p-1.5 text-fcn-text-light/50 hover:bg-fcn-primary/10 hover:text-fcn-primary dark:text-fcn-text-dark/50"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleToggleCollapse}
            className="rounded-md p-1.5 text-fcn-text-light/50 hover:bg-fcn-primary/10 hover:text-fcn-primary dark:text-fcn-text-dark/50"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map((group) => (
          <div key={group.group} className="mb-4">
            {(!sidebarCollapsed || isMobile) && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-fcn-text-light/30 dark:text-fcn-text-dark/30">
                {group.group}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/dashboard" || item.path === "/hospital-admin" || item.path === "/pharmacy-admin" || item.path === "/admin"}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-fcn-primary/10 text-fcn-primary"
                          : "text-fcn-text-light/60 hover:bg-fcn-primary/5 hover:text-fcn-text-light dark:text-fcn-text-dark/60 dark:hover:text-fcn-text-dark",
                        !isMobile && sidebarCollapsed && "justify-center px-2"
                      )
                    }
                    title={!isMobile && sidebarCollapsed ? item.label : undefined}
                  >
                    {ICON_MAP[item.icon as string] ?? <Home className="h-5 w-5" />}
                    {(!sidebarCollapsed || isMobile) && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-fcn-primary/10 p-3">
        {(!sidebarCollapsed || isMobile) && user && (
          <div className="flex items-center gap-3 truncate">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fcn-primary text-xs font-semibold text-white">
              {user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1 truncate">
              <p className="truncate text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                {user.full_name}
              </p>
              <p className="truncate text-xs capitalize text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                {user.role.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebar(false)}
        />
        {sidebarContent}
      </>
    );
  }

  return sidebarContent;
};

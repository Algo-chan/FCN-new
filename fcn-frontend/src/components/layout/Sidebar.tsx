import { useCallback, useMemo } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  Activity,
  ArrowUpCircle,
  BookOpen,
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
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useWindowSize } from "@/hooks/useWindowSize";
import type { Role } from "@/types";
import { getInitials, formatRole } from "@/utils/formatters";

interface NavItem {
  label: string;
  path: string;
  icon: string;
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
  BookOpen: <BookOpen className="h-5 w-5" />,
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
      ],
    },
    {
      group: "HEALTH",
      items: [
        { label: "Health Records", icon: "HeartPulse", path: "/health-records" },
        { label: "AI Health Check", icon: "Sparkles", path: "/ai-check" },
      ],
    },
    {
      group: "SERVICES",
      items: [
        { label: "Consultation", icon: "MessageCircle", path: "/consultation" },
        { label: "Pharmacy & Rx", icon: "Pill", path: "/pharmacy" },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ],
    },
  ],

  doctor: [
    {
      group: "MAIN",
      items: [
        { label: "Dashboard", icon: "Home", path: "/dashboard" },
        { label: "My Schedule", icon: "Calendar", path: "/doctor/schedule" },
        { label: "Appointment Requests", icon: "Inbox", path: "/appointments" },
        { label: "Consultations", icon: "MessageCircle", path: "/consultation" },
      ],
    },
    {
      group: "PATIENTS",
      items: [
        { label: "My Patients", icon: "Users", path: "/doctor/patients" },
        { label: "Prescriptions Issued", icon: "FileText", path: "/doctor/prescriptions" },
        { label: "Medical Articles", icon: "BookOpen", path: "/doctor/articles" },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ],
    },
  ],

  nurse: [
    {
      group: "MAIN",
      items: [
        { label: "Dashboard", icon: "Home", path: "/dashboard" },
        { label: "Today's Visits", icon: "MapPin", path: "/nurse/today" },
        { label: "My Patients", icon: "Users", path: "/nurse/patients" },
        { label: "Visit History", icon: "Clock", path: "/nurse/history" },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ],
    },
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
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ],
    },
  ],

  hospital_admin: [
    {
      group: "MY HOSPITAL",
      items: [
        { label: "Dashboard", icon: "Home", path: "/hospital-admin" },
        { label: "Update Occupancy", icon: "Activity", path: "/hospital-admin/occupancy" },
        { label: "My Doctors", icon: "Stethoscope", path: "/hospital-admin/doctors" },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ],
    },
  ],

  pharmacy_admin: [
    {
      group: "PHARMACY",
      items: [
        { label: "Dashboard", icon: "Home", path: "/pharmacy-admin" },
        { label: "Verify Prescription", icon: "QrCode", path: "/pharmacy-admin/verify" },
        { label: "Dispense History", icon: "ClipboardList", path: "/pharmacy-admin/history" },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ],
    },
  ],

  super_admin: [
    {
      group: "ADMIN PANEL",
      items: [
        { label: "Overview", icon: "LayoutDashboard", path: "/admin" },
        { label: "Users", icon: "Users", path: "/admin/users" },
        { label: "Hospitals", icon: "Building2", path: "/admin/hospitals" },
        { label: "Pharmacies", icon: "Pill", path: "/admin/pharmacies" },
        { label: "Article Moderation", icon: "BookOpen", path: "/admin/articles" },
        { label: "Settings", icon: "Settings", path: "/admin/settings" },
        { label: "Activity Logs", icon: "ClipboardList", path: "/admin/logs" },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Notifications", icon: "Bell", path: "/notifications" },
        { label: "Profile", icon: "User", path: "/profile" },
      ],
    },
  ],
};

const roleColors: Record<Role, { text: string; bg: string; activeGlow: string }> = {
  patient: {
    text: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-500/10 dark:bg-teal-400/20",
    activeGlow: "shadow-[0_2px_12px_rgba(20,184,166,0.25)]",
  },
  doctor: {
    text: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10 dark:bg-sky-400/20",
    activeGlow: "shadow-[0_2px_12px_rgba(14,165,233,0.25)]",
  },
  nurse: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 dark:bg-emerald-400/20",
    activeGlow: "shadow-[0_2px_12px_rgba(16,185,129,0.25)]",
  },
  rural_health_officer: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 dark:bg-amber-400/20",
    activeGlow: "shadow-[0_2px_12px_rgba(245,158,11,0.25)]",
  },
  hospital_admin: {
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10 dark:bg-indigo-400/20",
    activeGlow: "shadow-[0_2px_12px_rgba(99,102,241,0.25)]",
  },
  pharmacy_admin: {
    text: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 dark:bg-purple-400/20",
    activeGlow: "shadow-[0_2px_12px_rgba(168,85,247,0.25)]",
  },
  super_admin: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 dark:bg-rose-400/20",
    activeGlow: "shadow-[0_2px_12px_rgba(244,63,94,0.25)]",
  },
};

export const Sidebar = () => {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const setSidebar = useUiStore((state) => state.setSidebar);
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowSize();
  const isMobile = width < 1024;

  const currentRole = user?.role ?? "patient";
  const roleStyle = roleColors[currentRole] || roleColors.patient;

  const navGroups = useMemo(() => {
    return NAV_CONFIG[currentRole] ?? NAV_CONFIG.patient;
  }, [currentRole]);

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
      data-lenis-prevent
      className={clsx(
        "flex h-full flex-col border-r border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-slate-900/95 backdrop-blur-md",
        isMobile
          ? "fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 shadow-2xl"
          : "fixed inset-y-0 left-0 z-40 transition-all duration-300",
        isMobile ? "translate-x-0" : sidebarCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Header with Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4 dark:border-white/10">
        {!sidebarCollapsed || isMobile ? (
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <BrandLogo
              variant="adaptive"
              className="h-8 w-auto object-contain"
            />
          </Link>
        ) : (
          <Link to="/" className="mx-auto flex items-center justify-center hover:opacity-90 transition-opacity" title="Fast Care Now">
            <BrandLogo
              variant="icon"
              className="h-8 w-8 object-contain"
            />
          </Link>
        )}

        {isMobile ? (
          <button
            onClick={() => setSidebar(false)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={handleToggleCollapse}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200 transition-colors"
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

      {/* Navigation Groups */}
      <nav
        data-lenis-prevent
        className="flex-1 overflow-y-auto overscroll-contain px-2.5 py-4 space-y-5 touch-pan-y"
      >
        {navGroups.map((group) => (
          <div key={group.group}>
            {(!sidebarCollapsed || isMobile) && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.group}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={
                      item.path === "/dashboard" ||
                      item.path === "/appointments" ||
                      item.path === "/hospital-admin" ||
                      item.path === "/pharmacy-admin" ||
                      item.path === "/admin"
                    }
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      clsx(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 select-none",
                        isActive
                          ? clsx(
                              roleStyle.bg,
                              roleStyle.text,
                              roleStyle.activeGlow,
                              "font-bold"
                            )
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100",
                        !isMobile && sidebarCollapsed && "justify-center px-2"
                      )
                    }
                    title={!isMobile && sidebarCollapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={clsx(
                            "flex-shrink-0 transition-transform duration-150 group-hover:scale-105",
                            isActive ? roleStyle.text : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                          )}
                        >
                          {ICON_MAP[item.icon] ?? <Home className="h-5 w-5" />}
                        </span>

                        {(!sidebarCollapsed || isMobile) && (
                          <span className="truncate">{item.label}</span>
                        )}

                        {isActive && (!sidebarCollapsed || isMobile) && (
                          <span
                            className={clsx(
                              "ml-auto w-1.5 h-1.5 rounded-full",
                              roleStyle.text.includes("teal") && "bg-teal-500",
                              roleStyle.text.includes("sky") && "bg-sky-500",
                              roleStyle.text.includes("emerald") && "bg-emerald-500",
                              roleStyle.text.includes("amber") && "bg-amber-500",
                              roleStyle.text.includes("indigo") && "bg-indigo-500",
                              roleStyle.text.includes("purple") && "bg-purple-500",
                              roleStyle.text.includes("rose") && "bg-rose-500"
                            )}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-200/80 p-3 dark:border-white/10">
        {(!sidebarCollapsed || isMobile) && user && (
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-sky-600 text-xs font-bold text-white shadow-sm">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                {user.full_name}
              </p>
              <p className="truncate text-[11px] font-medium capitalize text-slate-400 dark:text-slate-500">
                {formatRole(user.role)}
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebar(false)}
        />
        {sidebarContent}
      </>
    );
  }

  return sidebarContent;
};

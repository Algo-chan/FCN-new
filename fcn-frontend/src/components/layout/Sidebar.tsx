import { useCallback, useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Heart,
  Hospital,
  LayoutDashboard,
  MessageSquare,
  Pill,
  Search,
  Settings,
  Shield,
  Stethoscope,
  Syringe,
  UserCheck,
  Users,
  X
} from "lucide-react";
import { clsx } from "clsx";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import type { Role } from "@/types";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: "Hospitals", path: "/hospitals", icon: <Hospital className="h-5 w-5" /> },
  { label: "Doctors", path: "/doctors", icon: <Stethoscope className="h-5 w-5" /> },
  { label: "Appointments", path: "/appointments", icon: <Calendar className="h-5 w-5" /> },
  { label: "Health Records", path: "/health-records", icon: <Activity className="h-5 w-5" />, roles: ["patient"] },
  { label: "AI Check", path: "/ai-check", icon: <Search className="h-5 w-5" />, roles: ["patient"] },
  { label: "Pharmacy", path: "/pharmacy", icon: <Pill className="h-5 w-5" /> },
  { label: "Messages", path: "/messages", icon: <MessageSquare className="h-5 w-5" /> },
  { label: "Notifications", path: "/notifications", icon: <Heart className="h-5 w-5" /> },
  { label: "Admin Panel", path: "/admin", icon: <Shield className="h-5 w-5" />, roles: ["super_admin"] },
  { label: "Pharmacy Admin", path: "/pharmacy-admin", icon: <Pill className="h-5 w-5" />, roles: ["pharmacy_admin"] },
  { label: "Doctor Dashboard", path: "/doctor-dashboard", icon: <UserCheck className="h-5 w-5" />, roles: ["doctor"] },
  { label: "Patients", path: "/patients", icon: <Users className="h-5 w-5" />, roles: ["doctor", "nurse"] },
  { label: "Prescriptions", path: "/prescriptions", icon: <ClipboardList className="h-5 w-5" />, roles: ["doctor"] },
  { label: "Vaccinations", path: "/vaccinations", icon: <Syringe className="h-5 w-5" />, roles: ["nurse", "rural_health_officer"] },
  { label: "Profile", path: "/profile", icon: <Settings className="h-5 w-5" /> }
];

export const Sidebar = () => {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const setSidebar = useUiStore((state) => state.setSidebar);
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);
  const user = useAuthStore((state) => state.user);

  const filteredItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (!item.roles) {
          return true;
        }
        return user ? item.roles.includes(user.role) : false;
      }),
    [user]
  );

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  if (!sidebarOpen) {
    return null;
  }

  return (
    <>
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-fcn-primary/10 bg-white transition-all duration-300 dark:bg-fcn-dark",
          sidebarCollapsed ? "w-[68px]" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-fcn-primary/10 px-4">
          {!sidebarCollapsed ? (
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
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {filteredItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/dashboard"}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-fcn-primary/10 text-fcn-primary"
                        : "text-fcn-text-light/60 hover:bg-fcn-primary/5 hover:text-fcn-text-light dark:text-fcn-text-dark/60 dark:hover:text-fcn-text-dark",
                      sidebarCollapsed && "justify-center px-2"
                    )
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-fcn-primary/10 p-3">
          {!sidebarCollapsed && user && (
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

      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setSidebar(false)}
        >
          <button
            onClick={() => setSidebar(false)}
            className="absolute right-4 top-4 rounded-md bg-white p-2 text-fcn-text-light shadow-md dark:bg-fcn-dark dark:text-fcn-text-dark"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
};

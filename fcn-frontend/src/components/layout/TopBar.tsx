import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User
} from "lucide-react";
import { clsx } from "clsx";
import { useUiStore } from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useClickOutside } from "@/hooks/useClickOutside";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

export const TopBar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const { isDark, toggleTheme } = useThemeMode();
  const { user, logout } = useAuth();
  const { addToast } = useNotifications();

  const dropdownRef = useClickOutside<HTMLDivElement>(() => {
    setDropdownOpen(false);
  });

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false);
    await logout();
    addToast({ type: "success", title: "Logged out", message: "You have been logged out successfully." });
  }, [logout, addToast]);

  return (
    <header
      className={clsx(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b border-fcn-primary/10 bg-white/80 backdrop-blur-md dark:bg-fcn-dark/80",
        sidebarOpen ? "md:ml-0" : ""
      )}
    >
      <div className="flex items-center gap-3 px-4">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 text-fcn-text-light/50 hover:bg-fcn-primary/10 hover:text-fcn-primary dark:text-fcn-text-dark/50"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden md:flex">
          <span className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            Welcome back, <span className="font-medium text-fcn-text-light dark:text-fcn-text-dark">{user?.full_name?.split(" ")[0] ?? "User"}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4">
        <button
          onClick={toggleTheme}
          className="rounded-md p-2 text-fcn-text-light/50 hover:bg-fcn-primary/10 hover:text-fcn-primary dark:text-fcn-text-dark/50"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <NotificationBell />

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-md p-1.5 hover:bg-fcn-primary/5"
            aria-label="User menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fcn-primary text-xs font-semibold text-white">
              {user?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) ?? "U"}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-lg border border-fcn-primary/10 bg-white shadow-lg dark:bg-fcn-dark">
              <div className="border-b border-fcn-primary/10 px-4 py-3">
                <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
                  {user?.full_name}
                </p>
                <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  {user?.email}
                </p>
              </div>

              <div className="p-1">
                {user?.role !== "super_admin" && (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-fcn-text-light/70 hover:bg-fcn-primary/5 hover:text-fcn-text-light dark:text-fcn-text-dark/70 dark:hover:text-fcn-text-dark"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      to="/admin/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-fcn-text-light/70 hover:bg-fcn-primary/5 hover:text-fcn-text-light dark:text-fcn-text-dark/70 dark:hover:text-fcn-text-dark"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                  </>
                )}
              </div>

              <div className="border-t border-fcn-primary/10 p-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-fcn-danger hover:bg-fcn-danger/5"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  LogOut,
  Menu,
  Moon,
  Sun,
  User,
  Settings,
  ShieldAlert,
  ChevronDown,
  Check,
} from "lucide-react";
import { clsx } from "clsx";
import { useUiStore } from "@/store/ui.store";
import { useThemeMode } from "@/hooks/useThemeMode";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useWindowSize } from "@/hooks/useWindowSize";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation, type Locale } from "@/i18n";
import { getInitials, formatRole } from "@/utils/formatters";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import type { Role } from "@/types";

const LANGUAGES: { code: Locale; name: string; nativeName: string; flag: string }[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", flag: "🇪🇹" },
  { code: "om", name: "Oromo", nativeName: "Afaan Oromoo", flag: "🇪🇹" },
];

const roleColors: Record<Role, { bg: string; text: string; dot: string }> = {
  patient: {
    bg: "bg-teal-500/10 dark:bg-teal-400/20",
    text: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-500",
  },
  doctor: {
    bg: "bg-sky-500/10 dark:bg-sky-400/20",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  nurse: {
    bg: "bg-emerald-500/10 dark:bg-emerald-400/20",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  rural_health_officer: {
    bg: "bg-amber-500/10 dark:bg-amber-400/20",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  hospital_admin: {
    bg: "bg-indigo-500/10 dark:bg-indigo-400/20",
    text: "text-indigo-700 dark:text-indigo-300",
    dot: "bg-indigo-500",
  },
  pharmacy_admin: {
    bg: "bg-purple-500/10 dark:bg-purple-400/20",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
  super_admin: {
    bg: "bg-rose-500/10 dark:bg-rose-400/20",
    text: "text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

export const TopBar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setSidebar = useUiStore((state) => state.setSidebar);
  const { isDark, toggleTheme } = useThemeMode();
  const { locale, setLocale } = useTranslation();
  const { user, logout } = useAuth();
  const { addToast } = useNotifications();
  const { width } = useWindowSize();
  const isMobile = width < 1024;

  const dropdownRef = useClickOutside<HTMLDivElement>(() => {
    setDropdownOpen(false);
    setLanguageOpen(false);
  });

  const handleLogout = useCallback(async () => {
    setDropdownOpen(false);
    await logout();
    addToast({
      type: "success",
      title: "Logged out",
      message: "You have been logged out successfully.",
    });
  }, [logout, addToast]);

  const handleMenuClick = useCallback(() => {
    if (isMobile) {
      setSidebar(!sidebarOpen);
    } else {
      toggleSidebar();
    }
  }, [isMobile, sidebarOpen, setSidebar, toggleSidebar]);

  const roleStyle = user?.role ? roleColors[user.role] : roleColors.patient;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 backdrop-blur-md px-3 sm:px-4 md:px-6 dark:border-white/10 dark:bg-slate-900/85">
      {/* Left: Sidebar toggle + Welcome message */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleMenuClick}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
            <img src="/logo/fcn-logo-full.png" alt="Fast Care Now" className="h-7 w-auto" />
          </Link>

          <div className="hidden sm:flex flex-col">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Welcome back</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[180px] lg:max-w-none">
              {user?.full_name ?? "User"}
            </span>
          </div>

          {user && (
            <span
              className={clsx(
                "hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize tracking-tight",
                roleStyle.bg,
                roleStyle.text
              )}
            >
              <span className={clsx("w-1.5 h-1.5 rounded-full", roleStyle.dot)} />
              {formatRole(user.role)}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions (Language, Theme, Install, Notifs, Profile) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Language Switcher (Desktop only - moved to Account Menu on mobile) */}
        <div className="hidden md:block">
          <LanguageSwitcher variant="pill" />
        </div>

        {/* PWA Install */}
        <InstallAppButton variant="ghost" size="sm" className="hidden md:inline-flex" />

        {/* Theme Toggle (Desktop only - moved to Account Menu on mobile) */}
        <button
          onClick={toggleTheme}
          className="hidden md:flex rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200 transition-colors"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
        </button>

        {/* Notification Bell (Desktop only - mobile uses BottomNavBar Notifications tab) */}
        <div className="hidden lg:block">
          <NotificationBell />
        </div>

        {/* User Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full p-1 transition-all hover:ring-2 hover:ring-teal-500/30"
            aria-label="User menu"
            aria-expanded={dropdownOpen}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-xs font-bold text-white shadow-sm">
              {user?.full_name ? getInitials(user.full_name) : "U"}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.14)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="border-b border-slate-100 dark:border-white/10 px-3 py-2.5 mb-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user?.full_name ?? "User"}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-400 truncate">
                  {user?.email ?? ""}
                </p>
                <div className="mt-2">
                  <span
                    className={clsx(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize",
                      roleStyle.bg,
                      roleStyle.text
                    )}
                  >
                    <span className={clsx("w-1.5 h-1.5 rounded-full", roleStyle.dot)} />
                    {formatRole(user?.role ?? "patient")}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
                >
                  <User className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span>My Profile</span>
                </Link>

                {user?.role === "super_admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
                  >
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                {/* Appearance / Mode Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {isDark ? (
                      <Sun className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Moon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    )}
                    <span>Appearance</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                    {isDark ? "Dark" : "Light"}
                  </span>
                </button>

                {/* Language Collapsible Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => setLanguageOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span>Language</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                        <span>{LANGUAGES.find((l) => l.code === locale)?.flag}</span>
                        <span>{LANGUAGES.find((l) => l.code === locale)?.nativeName ?? "English"}</span>
                      </span>
                      <ChevronDown
                        className={clsx(
                          "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
                          languageOpen && "rotate-180"
                        )}
                      />
                    </div>
                  </button>

                  {/* Options that appear when the language button is tapped */}
                  {languageOpen && (
                    <div className="mt-1 mb-1 mx-1 p-1 bg-slate-50 dark:bg-white/5 rounded-xl space-y-0.5 border border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-top-1 duration-150">
                      {LANGUAGES.map((lang) => {
                        const isSelected = locale === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              setLocale(lang.code);
                            }}
                            className={clsx(
                              "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left",
                              isSelected
                                ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold"
                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{lang.flag}</span>
                              <span className="font-semibold">{lang.nativeName}</span>
                              <span className="text-[10px] text-slate-400">({lang.name})</span>
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 dark:border-white/10 my-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import { create } from "zustand";
import type { ThemePreference, ToastMessage } from "@/types";

const THEME_KEY = "fcn_theme";
const SIDEBAR_KEY = "fcn_sidebar";

const initialTheme = (): ThemePreference => {
  if (typeof window === "undefined") {
    return "dark";
  }
  return (localStorage.getItem(THEME_KEY) as ThemePreference | null) ?? "dark";
};

const initialSidebar = (): boolean => {
  if (typeof window === "undefined") {
    return true;
  }
  const stored = localStorage.getItem(SIDEBAR_KEY);
  return stored !== null ? stored === "true" : true;
};

const applyTheme = (theme: ThemePreference): void => {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
};

interface UiState {
  theme: ThemePreference;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toasts: ToastMessage[];
  toggleTheme: () => void;
  setSidebar: (sidebarOpen: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addToast: (toast: Omit<ToastMessage, "id"> & { id?: string }) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set, get) => {
  const theme = initialTheme();
  applyTheme(theme);

  return {
    theme,
    sidebarOpen: initialSidebar(),
    sidebarCollapsed: false,
    toasts: [],
    toggleTheme: () => {
      const nextTheme = get().theme === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
      set({ theme: nextTheme });
    },
    setSidebar: (sidebarOpen) => {
      localStorage.setItem(SIDEBAR_KEY, String(sidebarOpen));
      set({ sidebarOpen });
    },
    toggleSidebar: () => {
      const next = !get().sidebarOpen;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      set({ sidebarOpen: next });
    },
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    addToast: (toast) =>
      set((state) => ({
        toasts: [
          ...state.toasts,
          {
            id: toast.id ?? crypto.randomUUID(),
            type: toast.type,
            title: toast.title,
            message: toast.message
          }
        ]
      })),
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  };
});

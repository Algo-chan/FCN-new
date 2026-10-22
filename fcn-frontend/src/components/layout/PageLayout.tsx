import { type PropsWithChildren, useCallback } from "react";
import { clsx } from "clsx";
import { PageTransition } from "@/components/animations/PageTransition";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useUiStore } from "@/store/ui.store";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { useWindowSize } from "@/hooks/useWindowSize";
import { Toast } from "@/components/ui/Toast";
import { InstantConsultOverlay } from "@/components/instant-consult/InstantConsultOverlay";
import { DoctorIncomingInstantModal } from "@/components/instant-consult/DoctorIncomingInstantModal";

export const PageLayout = ({ children }: PropsWithChildren) => {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const { toasts, removeToast } = useNotifications();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowSize();
  const isMobile = width < 1024;
  const updateActivity = useCallback(() => {
    useAuthStore.getState().updateActivity();
  }, []);

  const sidebarWidth = isMobile
    ? "ml-0"
    : !sidebarOpen
      ? "ml-0"
      : sidebarCollapsed
        ? "md:ml-[68px]"
        : "md:ml-64";

  return (
    <div
      className="min-h-screen bg-slate-50/70 text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200"
      onClick={updateActivity}
      onKeyDown={updateActivity}
      role="none"
    >
      <Sidebar />
      <div className={clsx("min-h-screen transition-all duration-300", sidebarWidth)}>
        <TopBar />
        <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8 lg:py-8 pb-28 lg:pb-8">
          <Breadcrumbs />
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* Floating Toasts (Raised above bottom nav on mobile) */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none lg:bottom-4">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className="cursor-pointer text-left pointer-events-auto transition-transform active:scale-98"
          >
            <Toast toast={toast} />
          </button>
        ))}
      </div>

      <div className="lg:hidden">
        <BottomNavBar />
      </div>

      {/* Instant Consultation Overlay for Patients */}
      <InstantConsultOverlay />

      {/* Incoming Call Notification for Doctors */}
      {user?.role === "doctor" && <DoctorIncomingInstantModal />}
    </div>
  );
};

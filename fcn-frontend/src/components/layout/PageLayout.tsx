import { type PropsWithChildren, useCallback } from "react";
import { clsx } from "clsx";
import { PageTransition } from "@/components/animations/PageTransition";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useUiStore } from "@/store/ui.store";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth.store";
import { useWindowSize } from "@/hooks/useWindowSize";
import { Toast } from "@/components/ui/Toast";

export const PageLayout = ({ children }: PropsWithChildren) => {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const { toasts, removeToast } = useNotifications();
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
      className="min-h-screen bg-fcn-light text-fcn-text-light dark:bg-fcn-dark dark:text-fcn-text-dark"
      onClick={updateActivity}
      onKeyDown={updateActivity}
      role="none"
    >
      <Sidebar />
      <div className={clsx("min-h-screen transition-all duration-300", sidebarWidth)}>
        <TopBar />
        <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8 lg:py-8 pb-20 lg:pb-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <button key={toast.id} onClick={() => removeToast(toast.id)} className="cursor-pointer text-left">
            <Toast toast={toast} />
          </button>
        ))}
      </div>

      <div className="lg:hidden">
        <BottomNavBar />
      </div>
    </div>
  );
};

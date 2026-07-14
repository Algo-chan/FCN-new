import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppRouter } from "@/router";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { OfflineDetector } from "@/components/layout/OfflineDetector";
import { useAuthStore } from "@/store/auth.store";
import "@/styles/globals.css";
import "@/styles/animations.css";
import "leaflet/dist/leaflet.css";
import "@/utils/leaflet-icon-fix";

const INACTIVITY_LIMIT = 3 * 24 * 60 * 60 * 1000;

const storedTheme = localStorage.getItem("fcn_theme") ?? "dark";
document.documentElement.classList.toggle("dark", storedTheme === "dark");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => undefined);
  });
}

const SessionRestorer = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const lastActivity = Number(localStorage.getItem("fcn_last_activity")) || 0;
    const elapsed = Date.now() - lastActivity;

    if (!lastActivity) {
      useAuthStore.getState().setLoading(false);
      return;
    }

    if (elapsed > INACTIVITY_LIMIT) {
      useAuthStore.getState().logout();
      useAuthStore.getState().setLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    if (useAuthStore.getState().isAuthenticated && useAuthStore.getState().accessToken) {
      useAuthStore.getState().setLoading(false);
      return;
    }

    import("@/services/auth.service").then(({ authService }) => {
      authService.refreshToken()
        .then(({ data }) => {
          if (data.success && data.data) {
            useAuthStore.getState().setTokens({
              accessToken: data.data.accessToken,
              refreshToken: data.data.refreshToken
            });
            useAuthStore.getState().updateActivity();
            return authService.getMe().then(({ data: meData }) => {
              const user = meData.data;
              if (user) {
                useAuthStore.getState().login(user, {
                  accessToken: data.data!.accessToken,
                  refreshToken: data.data!.refreshToken
                });
              }
            });
          }
        })
        .catch(() => {
          useAuthStore.getState().logout();
        })
        .finally(() => {
          useAuthStore.getState().setLoading(false);
        });
    });
  }, [navigate]);

  return null;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <SessionRestorer />
        <AppRouter />
        <OfflineDetector />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

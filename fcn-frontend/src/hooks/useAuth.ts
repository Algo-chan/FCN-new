import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useSound } from "@/hooks/useSound";

export const useAuth = () => {
  const navigate = useNavigate();
  const store = useAuthStore();
  const { playSuccess } = useSound();

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      store.setLoading(true);
      try {
        const { data: response } = await authService.login(credentials.email, credentials.password);
        const payload = response.data;

        if (!payload) {
          throw new Error(response.error?.message ?? "Login failed");
        }

        store.login(payload.user, { accessToken: payload.accessToken, refreshToken: "" });
        store.updateActivity();
        playSuccess();

        if (payload.user.role === "patient") {
          try {
            const { data: onboarding } = await authService.getOnboardingStatus();
            const completed = onboarding.data?.completed ?? false;
            store.setOnboardingCompleted(completed);
            navigate(completed ? "/dashboard" : "/onboarding", { replace: true });
          } catch {
            navigate("/onboarding", { replace: true });
          }
        } else if ((payload.user.role === "doctor" || payload.user.role === "nurse" || payload.user.role === "rural_health_officer") && payload.user.status === "pending") {
          navigate("/pending", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } finally {
        store.setLoading(false);
      }
    },
    [navigate, store, playSuccess]
  );

  const register = useCallback(
    async (data: Record<string, unknown>) => {
      store.setLoading(true);
      try {
        const { data: response } = await authService.register(data);
        const payload = response.data;

        if (!payload) {
          throw new Error(response.error?.message ?? "Registration failed");
        }

        if (payload.accessToken) {
          store.login(payload.user, { accessToken: payload.accessToken, refreshToken: "" });
          store.updateActivity();
        }
        playSuccess();

        if (payload.requiresApproval) {
          navigate("/pending", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      } finally {
        store.setLoading(false);
      }
    },
    [navigate, store, playSuccess]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    store.logout();
    navigate("/login", { replace: true });
  }, [navigate, store]);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    onboardingCompleted: store.onboardingCompleted,
    login,
    logout,
    register
  };
};

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { authService } from "@/services/auth.service";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const destination = searchParams.get("destination") || "/dashboard";

    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }

    useAuthStore.getState().setTokens({ accessToken, refreshToken: "" });

    authService
      .getMe()
      .then(({ data }) => {
        const user = data.data;
        if (!user) {
          navigate("/login", { replace: true });
          return;
        }

        useAuthStore.getState().login(user, { accessToken, refreshToken: "" });

        if (
          (user.role === "doctor" || user.role === "nurse" || user.role === "rural_health_officer") &&
          user.status === "pending"
        ) {
          navigate("/pending", { replace: true });
          return;
        }

        if (user.role === "patient") {
          authService
            .getOnboardingStatus()
            .then(({ data: onboarding }) => {
              if (onboarding.data?.completed) {
                useAuthStore.getState().setOnboardingCompleted(true);
                navigate("/dashboard", { replace: true });
              } else {
                navigate("/onboarding", { replace: true });
              }
            })
            .catch(() => navigate("/onboarding", { replace: true }));
          return;
        }

        navigate(destination, { replace: true });
      })
      .catch(() => {
        navigate("/login", { replace: true });
      });
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-fcn-dark">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-fcn-primary" />
        <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          Signing you in...
        </p>
      </div>
    </div>
  );
}

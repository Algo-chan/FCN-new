import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { SESSION_INACTIVITY_LIMIT_MS } from "@/constants/session";
import { getRoleDashboard } from "@/constants/roles";

export const LaunchPage = () => {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const lastActivity = useAuthStore((state) => state.last_activity);

  if (isLoading) return null;

  const sessionFresh = lastActivity > 0 && Date.now() - lastActivity <= SESSION_INACTIVITY_LIMIT_MS;

  if (isAuthenticated && sessionFresh && user) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};
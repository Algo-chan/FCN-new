import { useEffect, useMemo } from "react";
import { connectSocket, disconnectSocket, getSocket } from "@/services/socket.service";
import { useAuthStore } from "@/store/auth.store";

export const useSocket = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated]);

  return socket;
};

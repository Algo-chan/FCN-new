import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000", {
      autoConnect: false,
      auth: {
        token: useAuthStore.getState().accessToken
      }
    });
  }

  return socket;
};

export const connectSocket = (): Socket => {
  const instance = getSocket();
  instance.auth = { token: useAuthStore.getState().accessToken };

  if (!instance.connected) {
    instance.connect();
  }

  return instance;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
};

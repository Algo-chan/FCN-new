import { useEffect, useRef, useCallback, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth.store";

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinConsultation: (appointmentId: string) => void;
  sendMessage: (appointmentId: string, text: string) => void;
  sendFile: (appointmentId: string, file: File) => Promise<void>;
  startTyping: (appointmentId: string) => void;
  stopTyping: (appointmentId: string) => void;
  markRead: (appointmentId: string, messageIds: string[]) => void;
  endConsultation: (appointmentId: string) => void;
}

export const useSocket = (): UseSocketReturn => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_URL ?? "http://localhost:5000";

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      setIsConnected(false);
    });

    socketRef.current = socket;
    setSocket(socket);

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [accessToken]);

  const joinConsultation = useCallback((appointmentId: string) => {
    socketRef.current?.emit("join_consultation", { appointmentId });
  }, []);

  const sendMessage = useCallback((appointmentId: string, text: string) => {
    socketRef.current?.emit("send_message", {
      appointmentId,
      messageText: text,
      messageType: "text"
    });
  }, []);

  const sendFile = useCallback(async (appointmentId: string, file: File) => {
    let processedFile = file;

    if (file.type.startsWith("image/")) {
      try {
        const imageCompression = await import("browser-image-compression");
        processedFile = await imageCompression.default(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        });
      } catch {
        console.warn("Image compression failed, sending original file");
      }
    }

    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];

        socketRef.current?.emit(
          "send_file",
          {
            appointmentId,
            fileData: base64Data,
            fileName: processedFile.name,
            fileType: processedFile.type,
            fileSize: processedFile.size
          },
            (response: { error?: string }) => {
            if (response?.error) {
              reject(new Error(response.error));
            } else {
              resolve();
            }
          }
        );
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(processedFile);
    });
  }, []);

  const startTyping = useCallback((appointmentId: string) => {
    socketRef.current?.emit("typing_start", { appointmentId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing_stop", { appointmentId });
    }, 3000);
  }, []);

  const stopTyping = useCallback((appointmentId: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketRef.current?.emit("typing_stop", { appointmentId });
  }, []);

  const markRead = useCallback((appointmentId: string, messageIds: string[]) => {
    socketRef.current?.emit("mark_read", { appointmentId, messageIds });
  }, []);

  const endConsultation = useCallback((appointmentId: string) => {
    socketRef.current?.emit("end_consultation", { appointmentId });
  }, []);

  return {
    socket,
    isConnected,
    joinConsultation,
    sendMessage,
    sendFile,
    startTyping,
    stopTyping,
    markRead,
    endConsultation
  };
};

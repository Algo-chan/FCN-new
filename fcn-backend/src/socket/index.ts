import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { corsOrigins } from "../config/env";
import { logger } from "../utils/logger";

export const consultationRoom = (appointmentId: string): string => `consultation:${appointmentId}`;

export const initSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    logger.info("Socket connected", { socketId: socket.id });

    socket.on("join:consultation", (appointmentId: string) => {
      socket.join(consultationRoom(appointmentId));
      logger.info("Socket joined consultation room", { socketId: socket.id, appointmentId });
    });

    socket.on("disconnect", (reason) => {
      logger.info("Socket disconnected", { socketId: socket.id, reason });
    });
  });

  return io;
};

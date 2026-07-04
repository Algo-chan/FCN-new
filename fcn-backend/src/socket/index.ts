import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { corsOrigins } from "../config/env";
import { prisma } from "../config/database";
import { redisSet, redisDel, redisGet } from "../config/redis";
import { verifyAccessToken } from "../utils/jwt";
import { encrypt, decrypt } from "../utils/encryption";
import { cloudinary } from "../config/cloudinary";
import { notificationService } from "../modules/notifications/notification.service";
import { logger } from "../utils/logger";
import type { JwtAccessPayload } from "../types";
import type { MessageType } from "@prisma/client";

let io: Server;

export const consultationRoom = (appointmentId: string): string => `consultation:${appointmentId}`;

export const getIO = (): Server => io;

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true
    }
  });

  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication failed: no token provided"));
    }
    try {
      const decoded = verifyAccessToken(token) as JwtAccessPayload;
      socket.data.user = { id: decoded.id, role: decoded.role, full_name: "" };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { full_name: true }
      });
      if (user) {
        socket.data.user.full_name = user.full_name;
      }
      next();
    } catch {
      next(new Error("Authentication failed: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    logger.info(`Socket connected: ${user.full_name} (${user.role}) [${socket.id}]`);

    socket.on("join_consultation", async ({ appointmentId }) => {
      try {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          select: { patient_id: true, doctor_id: true }
        });

        if (!appointment) {
          socket.emit("error", { message: "Appointment not found" });
          return;
        }

        const isPatient = appointment.patient_id === user.id;
        const isDoctor = appointment.doctor_id === user.id;

        if (!isPatient && !isDoctor) {
          socket.emit("error", { message: "You are not authorized for this consultation" });
          return;
        }

        socket.join(consultationRoom(appointmentId));

        const appointmentFull = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: {
            patient: { select: { id: true, full_name: true, email: true, phone: true } },
            doctor: {
              select: {
                id: true, full_name: true, email: true,
                doctor_profile: { select: { specialty: true, photo_url: true } }
              }
            }
          }
        });

        const recentMessages = await prisma.message.findMany({
          where: { appointment_id: appointmentId, deleted_at: null },
          orderBy: { sent_at: "desc" },
          take: 50,
          include: {
            sender: { select: { id: true, full_name: true } }
          }
        });

        const decryptedMessages = recentMessages.map((msg) => {
          let decryptedText = msg.message_text;
          if (msg.message_type !== "system") {
            try {
              decryptedText = decrypt(msg.message_text, msg.message_iv);
            } catch {
              decryptedText = "[decryption error]";
            }
          }
          return {
            id: msg.id,
            conversation_id: msg.conversation_id,
            appointment_id: msg.appointment_id,
            sender_user_id: msg.sender_user_id,
            recipient_user_id: msg.recipient_user_id,
            sender_name: msg.sender.full_name,
            message_text: decryptedText,
            message_type: msg.message_type,
            file_url: msg.file_url,
            file_type: msg.file_type,
            file_name: msg.file_name,
            file_size_bytes: msg.file_size_bytes,
            is_system_message: msg.is_system_message,
            sent_at: msg.sent_at.toISOString(),
            read_at: msg.read_at?.toISOString() ?? null
          };
        });

        socket.emit("consultation_joined", {
          appointment: appointmentFull,
          recentMessages: decryptedMessages.reverse()
        });

        socket.to(consultationRoom(appointmentId)).emit("user_joined", {
          userId: user.id,
          userName: user.full_name,
          userRole: user.role
        });

        await redisSet(`consultation:${appointmentId}:${user.id}:online`, "1", 3600);
      } catch (error) {
        logger.error("join_consultation error", { error });
        socket.emit("error", { message: "Failed to join consultation" });
      }
    });

    socket.on("send_message", async ({ appointmentId, messageText, messageType = "text" }) => {
      try {
        const room = consultationRoom(appointmentId);
        const socketsInRoom = io.sockets.adapter.rooms.get(room);
        if (!socketsInRoom || !socketsInRoom.has(socket.id)) {
          socket.emit("error", { message: "You are not in this consultation room" });
          return;
        }

        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          select: { status: true, patient_id: true, doctor_id: true }
        });

        if (!appointment || appointment.status !== "in_session") {
          socket.emit("error", { message: "Cannot send messages when consultation is not active" });
          return;
        }

        const recipientId = appointment.patient_id === user.id ? appointment.doctor_id : appointment.patient_id;

        const { encrypted, iv } = encrypt(messageText);

        const message = await prisma.message.create({
          data: {
            conversation_id: appointmentId,
            appointment_id: appointmentId,
            sender_user_id: user.id,
            recipient_user_id: recipientId,
            message_text: encrypted,
            message_iv: iv,
            message_type: messageType as MessageType
          },
          include: {
            sender: { select: { id: true, full_name: true } }
          }
        });

        const decryptedMsg = {
          id: message.id,
          conversation_id: message.conversation_id,
          appointment_id: message.appointment_id,
          sender_user_id: message.sender_user_id,
          recipient_user_id: message.recipient_user_id,
          sender_name: message.sender.full_name,
          message_text: messageText,
          message_type: message.message_type,
          file_url: null,
          file_type: null,
          file_name: null,
          file_size_bytes: null,
          is_system_message: false,
          sent_at: message.sent_at.toISOString(),
          read_at: null
        };

        io.to(room).emit("new_message", decryptedMsg);
      } catch (error) {
        logger.error("send_message error", { error });
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("send_file", async ({ appointmentId, fileData, fileName, fileType, fileSize }, callback) => {
      const ack = typeof callback === "function" ? callback : () => {};
      try {
        const room = consultationRoom(appointmentId);
        const socketsInRoom = io.sockets.adapter.rooms.get(room);
        if (!socketsInRoom || !socketsInRoom.has(socket.id)) {
          ack({ error: "You are not in this consultation room" });
          return;
        }

        if (!ALLOWED_FILE_TYPES.includes(fileType)) {
          ack({ error: "File type not allowed. Accepted: JPEG, PNG, WebP, PDF" });
          return;
        }

        if (fileSize > MAX_FILE_SIZE) {
          ack({ error: "File size exceeds 10MB limit" });
          return;
        }

        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          select: { status: true, patient_id: true, doctor_id: true }
        });

        if (!appointment || appointment.status !== "in_session") {
          ack({ error: "Cannot send files when consultation is not active" });
          return;
        }

        const buffer = Buffer.from(fileData, "base64");

        const isImage = fileType.startsWith("image/");
        let uploadResult;

        if (isImage) {
          uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "fcn/chat-files",
                resource_type: "image",
                transformation: [{ width: 1200, quality: "auto", format: "webp" }]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result as { secure_url: string; public_id: string });
              }
            );
            uploadStream.end(buffer);
          });
        } else {
          uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "fcn/chat-files",
                resource_type: "raw",
                use_filename: true,
                unique_filename: true
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result as { secure_url: string; public_id: string });
              }
            );
            uploadStream.end(buffer);
          });
        }

        const recipientId = appointment.patient_id === user.id ? appointment.doctor_id : appointment.patient_id;

        const message = await prisma.message.create({
          data: {
            conversation_id: appointmentId,
            appointment_id: appointmentId,
            sender_user_id: user.id,
            recipient_user_id: recipientId,
            message_text: "",
            message_iv: "",
            message_type: "file",
            file_url: uploadResult.secure_url,
            file_type: isImage ? "image" : "pdf",
            file_name: fileName,
            file_size_bytes: fileSize
          },
          include: {
            sender: { select: { id: true, full_name: true } }
          }
        });

        io.to(room).emit("new_message", {
          id: message.id,
          conversation_id: message.conversation_id,
          appointment_id: message.appointment_id,
          sender_user_id: message.sender_user_id,
          recipient_user_id: message.recipient_user_id,
          sender_name: message.sender.full_name,
          message_text: "",
          message_type: "file",
          file_url: message.file_url,
          file_type: message.file_type,
          file_name: message.file_name,
          file_size_bytes: message.file_size_bytes,
          is_system_message: false,
          sent_at: message.sent_at.toISOString(),
          read_at: null
        });

        ack({});
      } catch (error) {
        logger.error("send_file error", { error });
        ack({ error: "Failed to send file" });
      }
    });

    socket.on("typing_start", ({ appointmentId }) => {
      const room = consultationRoom(appointmentId);
      socket.to(room).emit("user_typing", {
        userId: user.id,
        userName: user.full_name
      });
    });

    socket.on("typing_stop", ({ appointmentId }) => {
      const room = consultationRoom(appointmentId);
      socket.to(room).emit("user_stopped_typing", {
        userId: user.id
      });
    });

    socket.on("mark_read", async ({ appointmentId, messageIds }) => {
      try {
        await prisma.message.updateMany({
          where: {
            id: { in: messageIds },
            appointment_id: appointmentId,
            recipient_user_id: user.id,
            read_at: null
          },
          data: { read_at: new Date() }
        });

        io.to(consultationRoom(appointmentId)).emit("messages_read", {
          messageIds,
          readBy: user.id,
          read_at: new Date().toISOString()
        });
      } catch (error) {
        logger.error("mark_read error", { error });
      }
    });

    socket.on("end_consultation", async ({ appointmentId }) => {
      try {
        if (user.role !== "doctor") {
          socket.emit("error", { message: "Only doctors can end consultations" });
          return;
        }

        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: {
            patient: { select: { id: true, full_name: true } },
            doctor: { select: { id: true, full_name: true } }
          }
        });

        if (!appointment || appointment.doctor_id !== user.id) {
          socket.emit("error", { message: "You are not the doctor for this consultation" });
          return;
        }

        const now = new Date();

        await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: "completed",
            consultation_ended_at: now,
            actual_end_time: now
          }
        });

        await prisma.doctorProfile.update({
          where: { user_id: user.id },
          data: { availability_status: "available" }
        });

        const messageCount = await prisma.message.count({
          where: { appointment_id: appointmentId, deleted_at: null }
        });

        await prisma.consultationSummary.upsert({
          where: { appointment_id: appointmentId },
          create: {
            appointment_id: appointmentId,
            patient_id: appointment.patient_id,
            doctor_id: appointment.doctor_id,
            total_messages: messageCount,
            started_at: appointment.consultation_started_at ?? now,
            ended_at: now
          },
          update: {
            total_messages: messageCount,
            ended_at: now
          }
        });

        io.to(consultationRoom(appointmentId)).emit("consultation_ended", {
          ended_at: now.toISOString(),
          ended_by: user.full_name,
          message: "This consultation has ended"
        });

        await notificationService.send({
          userId: appointment.patient_id,
          type: "consultation_ended",
          title: "Consultation Completed",
          message: `Your consultation with Dr. ${user.full_name} has ended. Please rate your experience.`,
          actionUrl: `/consultation/${appointmentId}`,
          sendPush: true
        });
      } catch (error) {
        logger.error("end_consultation error", { error });
        socket.emit("error", { message: "Failed to end consultation" });
      }
    });

    socket.on("disconnect", async () => {
      logger.info(`Socket disconnected: ${user.full_name} [${socket.id}]`);

      const rooms = Array.from(socket.rooms);
      for (const room of rooms) {
        if (room.startsWith("consultation:")) {
          const appointmentId = room.replace("consultation:", "");
          await redisDel(`consultation:${appointmentId}:${user.id}:online`);
          socket.to(room).emit("user_left", {
            userId: user.id,
            userName: user.full_name
          });
        }
      }
    });
  });

  return io;
};

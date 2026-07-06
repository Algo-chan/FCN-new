import { api } from "@/services/api";
import type { ApiResponse, Notification } from "@/types";

export interface GroupedNotifications {
  appointments: Notification[];
  messages: Notification[];
  health: Notification[];
  pharmacy: Notification[];
  account: Notification[];
  counts: {
    total: number;
    unread: number;
    appointments_unread: number;
    messages_unread: number;
    health_unread: number;
    pharmacy_unread: number;
    account_unread: number;
  };
}

export const notificationsService = {
  getNotifications: (group?: string, page?: number) =>
    api.get<ApiResponse<GroupedNotifications>>("/notifications", {
      params: { ...(group ? { group } : {}), ...(page ? { page } : {}) }
    }).then((r) => r.data),

  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>("/notifications/unread-count").then((r) => r.data),

  markAllRead: () =>
    api.patch<ApiResponse<{ message: string }>>("/notifications/mark-read").then((r) => r.data),

  markOneRead: (id: string) =>
    api.patch<ApiResponse<{ message: string }>>(`/notifications/${id}/read`).then((r) => r.data),

  clearAllRead: () =>
    api.delete<ApiResponse<{ message: string }>>("/notifications/clear-all").then((r) => r.data),

  saveFCMToken: (token: string) =>
    api.post<ApiResponse<{ message: string }>>("/notifications/fcm-token", { token }).then((r) => r.data)
};

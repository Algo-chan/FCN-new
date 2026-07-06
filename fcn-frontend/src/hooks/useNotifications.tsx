import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { notificationsService } from "@/services/notifications.service";
import { requestNotificationPermission, onForegroundMessage } from "@/config/firebase";
import { useAuthStore } from "@/store/auth.store";
import { useUiStore } from "@/store/ui.store";
import { useSound } from "@/hooks/useSound";
import { ForegroundNotificationToast } from "@/components/notifications/ForegroundNotificationToast";
import type { Notification } from "@/types";

interface GroupedNotifications {
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

export function useNotifications() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const { playNotification } = useSound();

  const toasts = useUiStore((state) => state.toasts);
  const addToast = useUiStore((state) => state.addToast);
  const removeToast = useUiStore((state) => state.removeToast);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => notificationsService.getNotifications(),
    staleTime: 30 * 1000,
    enabled: !!user,
    refetchInterval: 60 * 1000,
    select: (res) => res.data as GroupedNotifications
  });

  const unreadQuery = useQuery({
    queryKey: ["notifications-unread", user?.id],
    queryFn: () => notificationsService.getUnreadCount(),
    staleTime: 15 * 1000,
    enabled: !!user,
    refetchInterval: 30 * 1000,
    select: (res) => res.data?.count ?? 0
  });

  useEffect(() => {
    if (!user) return;

    requestNotificationPermission().then((token) => {
      if (token) {
        notificationsService.saveFCMToken(token).catch(() => undefined);
      }
    });

    onForegroundMessage((payload) => {
      const title = payload.notification?.title || "FCN";
      const body = payload.notification?.body || "";

      toast.custom(
        (t) => (
          <ForegroundNotificationToast
            title={title}
            body={body}
            payload={payload}
            onDismiss={() => toast.dismiss(t.id)}
          />
        ),
        { duration: 6000 }
      );

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });

      playNotification();
    });
  }, [user, queryClient, playNotification]);

  const markAllRead = async () => {
    await notificationsService.markAllRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
  };

  const markOneRead = async (id: string) => {
    await notificationsService.markOneRead(id);
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
  };

  return {
    notifications: notificationsQuery.data,
    unreadCount: unreadQuery.data ?? 0,
    isLoading: notificationsQuery.isLoading || unreadQuery.isLoading,
    markAllRead,
    markOneRead,
    toasts,
    addToast,
    removeToast,
  };
}

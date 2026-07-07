import { prisma } from "../../config/database";
import { redis } from "../../config/redis";
import type { Notification } from "@prisma/client";

interface NotificationWithExtras extends Notification {
  timeAgo?: string;
}

interface GroupedNotifications {
  appointments: NotificationWithExtras[];
  messages: NotificationWithExtras[];
  health: NotificationWithExtras[];
  pharmacy: NotificationWithExtras[];
  account: NotificationWithExtras[];
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

class NotificationsQueryService {
  private getUnreadCacheKey(userId: string): string {
    return `unread:${userId}`;
  }

  async getNotifications(
    userId: string,
    groupType?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GroupedNotifications> {
    const where: any = { user_id: userId };
    if (groupType) where.group_type = groupType;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { priority: 'asc' },
        { created_at: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    const grouped: GroupedNotifications = {
      appointments: [],
      messages: [],
      health: [],
      pharmacy: [],
      account: [],
      counts: { total: 0, unread: 0, appointments_unread: 0, messages_unread: 0, health_unread: 0, pharmacy_unread: 0, account_unread: 0 }
    };

    for (const notif of notifications) {
      const group = (notif.group_type || 'appointments') as keyof typeof grouped;
      if (group in grouped && Array.isArray(grouped[group])) {
        (grouped[group] as NotificationWithExtras[]).push(notif);
      }
    }

    const total = await prisma.notification.count({ where: { user_id: userId } });
    const unread = await this.getUnreadCount(userId);

    grouped.counts.total = total;
    grouped.counts.unread = unread;

    for (const group of Object.keys(grouped)) {
      if (group === 'counts') continue;
      const arr = grouped[group as keyof Omit<GroupedNotifications, 'counts'>] as NotificationWithExtras[];
      if (Array.isArray(arr)) {
        const key = `${group}_unread` as keyof typeof grouped.counts;
        grouped.counts[key] = arr.filter((n) => !n.read).length;
      }
    }

    return grouped;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = this.getUnreadCacheKey(userId);

    try {
      const cached = await redis.get(cacheKey);
      if (cached !== null) return parseInt(cached, 10);
    } catch {
      // Redis unavailable, fall through to DB
    }

    const count = await prisma.notification.count({
      where: { user_id: userId, read: false }
    });

    try {
      await redis.set(cacheKey, count.toString(), "EX", 30);
    } catch {
      // Redis cache set failure is non-critical
    }

    return count;
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true, read_at: new Date() }
    });

    await this.invalidateUnreadCache(userId);
  }

  async markOneRead(notificationId: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification || notification.user_id !== userId) return;

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, read_at: new Date() }
    });

    await this.invalidateUnreadCache(userId);
  }

  async clearAllRead(userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { user_id: userId, read: true }
    });

    await this.invalidateUnreadCache(userId);
  }

  async saveFCMToken(userId: string, token: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { fcm_token: token }
    });
  }

  async clearFCMToken(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { fcm_token: null }
    });
  }

  private async invalidateUnreadCache(userId: string): Promise<void> {
    try {
      await redis.del(this.getUnreadCacheKey(userId));
    } catch {
      // Non-critical
    }
  }
}

export const notificationsQueryService = new NotificationsQueryService();

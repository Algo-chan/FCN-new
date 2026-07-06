import { useState, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Trash2, CheckCheck, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { format } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FadeIn } from "@/components/animations/FadeIn";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications } from "@/hooks/useNotifications";
import { notificationsService } from "@/services/notifications.service";
import { GROUP_LABELS, GROUP_EMPTY_MESSAGES } from "@/constants/notifications";
import type { Notification, ApiResponse } from "@/types";
import type { GroupedNotifications } from "@/services/notifications.service";

type GroupTab = "all" | "appointments" | "messages" | "health" | "pharmacy" | "account";
type NotificationGroupKey = "appointments" | "messages" | "health" | "pharmacy" | "account";

const groups: GroupTab[] = ["all", "appointments", "messages", "health", "pharmacy", "account"];

const NotificationsPage = () => {
  const shouldReduceMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { addToast } = useNotifications();
  const [activeGroup, setActiveGroup] = useState<GroupTab>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["notifications", user?.id, activeGroup, page],
    queryFn: () => notificationsService.getNotifications(activeGroup === "all" ? undefined : activeGroup, page),
    staleTime: 30 * 1000,
    enabled: !!user,
    select: (res) => res.data
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      addToast({ type: "success", title: "All notifications marked as read" });
    }
  });

  const clearReadMutation = useMutation({
    mutationFn: () => notificationsService.clearAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      addToast({ type: "success", title: "Read notifications cleared" });
    }
  });

  const markOneReadHandler = (id: string) => {
    notificationsService.markOneRead(id).then(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    });
  };

  const allNotifications = useMemo((): Notification[] => {
    if (!data) return [];
    const d = data as GroupedNotifications;
    if (activeGroup === "all") {
      const all: Notification[] = [];
      for (const key of ["appointments", "messages", "health", "pharmacy", "account"] as const) {
        const arr = d[key];
        if (Array.isArray(arr)) all.push(...arr);
      }
      return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return d[activeGroup as NotificationGroupKey] || [];
  }, [data, activeGroup]);

  const groupedByDate = useMemo(() => {
    const grouped: Record<string, Notification[]> = {};
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);

    for (const notif of allNotifications) {
      const date = new Date(notif.created_at);
      let key: string;

      if (date.toDateString() === today.toDateString()) {
        key = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "Yesterday";
      } else {
        key = format(date, "MMMM d, yyyy");
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(notif);
    }

    return grouped;
  }, [allNotifications]);

  const groupedBySection = useMemo(() => {
    if (activeGroup !== "all" || !data) return null;

    const d = data as GroupedNotifications;
    const sections: Record<string, Notification[]> = {};
    for (const group of groups) {
      if (group === "all") continue;
      const arr = d[group as NotificationGroupKey];
      if (arr && arr.length > 0) {
        sections[GROUP_LABELS[group] || group] = arr;
      }
    }
    return sections;
  }, [data, activeGroup]);

  const totalUnread = data?.counts?.unread ?? 0;

  return (
    <FadeIn>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              Notifications
            </h1>
            {totalUnread > 0 && (
              <Badge variant="warning">{totalUnread} unread</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<CheckCheck className="h-4 w-4" />}
              onClick={() => markAllMutation.mutate()}
              loading={markAllMutation.isPending}
              disabled={totalUnread === 0}
            >
              Mark All Read
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => clearReadMutation.mutate()}
              loading={clearReadMutation.isPending}
            >
              Clear Read
            </Button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-lg border border-fcn-primary/20 p-1">
          {groups.map((group) => {
            const unread = data?.counts?.[`${group}_unread` as keyof typeof data.counts] as number || 0;
            return (
              <button
                key={group}
                onClick={() => { setActiveGroup(group); setPage(1); }}
                className={clsx(
                  "relative shrink-0 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  activeGroup === group
                    ? "bg-fcn-primary text-white"
                    : "text-fcn-text-light/60 hover:bg-fcn-primary/10 hover:text-fcn-primary dark:text-fcn-text-dark/60"
                )}
              >
                {GROUP_LABELS[group] || group}
                {unread > 0 && (
                  <span className="ml-2 rounded-full bg-fcn-primary/20 px-2 py-0.5 text-[11px] font-bold">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-fcn-primary" />
          </div>
        ) : allNotifications.length === 0 ? (
          <Card className="flex flex-col items-center gap-4 p-12 text-center">
            <motion.div
              animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Bell className="h-20 w-20 text-fcn-primary/30" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                You're all caught up!
              </h2>
              <p className="mt-1 text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                {GROUP_EMPTY_MESSAGES[activeGroup] || "No new notifications right now."}
              </p>
              <p className="mt-1 text-xs text-fcn-text-light/30 dark:text-fcn-text-dark/30">
                Check back after your next consultation.
              </p>
            </div>
            <img src="/logo/fcn-logo-full.png" alt="FCN" className="h-6 w-auto opacity-40" />
          </Card>
        ) : (
          <div className="space-y-6">
            {activeGroup === "all" && groupedBySection ? (
              Object.entries(groupedBySection).map(([sectionLabel, sectionNotifs]) => (
                <div key={sectionLabel}>
                  <h2 className="mb-3 text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">
                    {sectionLabel}
                  </h2>
                  <div className="overflow-hidden rounded-lg border border-fcn-primary/10">
                    <AnimatePresence mode="popLayout">
                      {sectionNotifs.map((notif) => (
                        <NotificationItem
                          key={notif.id}
                          notification={notif}
                          onRead={markOneReadHandler}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))
            ) : (
              <div>
                {Object.entries(groupedByDate).map(([dateLabel, dateNotifs]) => (
                  <div key={dateLabel}>
                    <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-fcn-text-light/40 dark:text-fcn-text-dark/40 first:mt-0">
                      {dateLabel}
                    </h3>
                    <div className="overflow-hidden rounded-lg border border-fcn-primary/10">
                      <AnimatePresence mode="popLayout">
                        {dateNotifs.map((notif) => (
                          <NotificationItem
                            key={notif.id}
                            notification={notif}
                            onRead={markOneReadHandler}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {allNotifications.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setPage((p) => p + 1)}
                  loading={isFetching}
                  disabled={allNotifications.length < 20}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </FadeIn>
  );
};

export default NotificationsPage;

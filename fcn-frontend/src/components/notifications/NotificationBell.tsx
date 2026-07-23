import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { clsx } from "clsx";
import { NotificationItem } from "./NotificationItem";
import { useNotifications } from "@/hooks/useNotifications";
import { useWindowSize } from "@/hooks/useWindowSize";
import { GROUP_LABELS, GROUP_EMPTY_MESSAGES } from "@/constants/notifications";
import type { Notification } from "@/types";

type GroupTab = "all" | "appointments" | "messages" | "health" | "pharmacy" | "account";

const groups: GroupTab[] = ["all", "appointments", "messages", "health", "pharmacy", "account"];

export const NotificationBell = () => {
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<GroupTab>("all");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();
  const isMobile = width < 1024;

  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const getFilteredNotifications = useCallback((): Notification[] => {
    if (!notifications) return [];
    if (activeGroup === "all") {
      const all: Notification[] = [];
      for (const key of Object.keys(notifications)) {
        if (key === "counts") continue;
        all.push(...(notifications[key as keyof typeof notifications] as Notification[]));
      }
      return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return (notifications[activeGroup as keyof typeof notifications] as Notification[]) || [];
  }, [notifications, activeGroup]);

  const filtered = getFilteredNotifications().slice(0, 8);

  const getGroupUnread = (group: GroupTab): number => {
    if (!notifications?.counts) return 0;
    if (group === "all") return notifications.counts.unread;
    const key = `${group}_unread` as keyof typeof notifications.counts;
    return notifications.counts[key] as number || 0;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-md p-2 text-fcn-text-light/50 hover:bg-fcn-primary/10 hover:text-fcn-primary dark:text-fcn-text-dark/50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            initial={shouldReduceMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 15 }}
            className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-fcn-danger px-1 text-[10px] font-bold leading-tight text-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {isMobile && (
              <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
            )}
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95, transformOrigin: "top right" }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className={clsx(
                "overflow-hidden border border-fcn-primary/10 bg-white shadow-xl dark:bg-fcn-dark z-50",
                isMobile
                  ? "fixed left-0 right-0 top-16 max-h-[calc(100vh-64px)] w-full rounded-none"
                  : "absolute right-0 top-full mt-2 w-[380px] rounded-xl"
              )}
            >
              <div className="flex items-center justify-between border-b border-fcn-primary/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-fcn-text-light dark:text-fcn-text-dark">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="text-xs text-fcn-primary">{unreadCount} unread</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-medium text-fcn-primary hover:text-fcn-accent"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="flex gap-1 overflow-x-auto border-b border-fcn-primary/10 px-3 py-2 hide-scrollbar">
                {groups.map((group) => {
                  const unread = getGroupUnread(group);
                  return (
                    <button
                      key={group}
                      onClick={() => setActiveGroup(group)}
                      className={clsx(
                        "relative shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                        activeGroup === group
                          ? "bg-fcn-primary text-white"
                          : "text-fcn-text-light/60 hover:bg-fcn-primary/10 hover:text-fcn-primary dark:text-fcn-text-dark/60"
                      )}
                    >
                      {GROUP_LABELS[group] || group}
                      {unread > 0 && (
                        <span className="ml-1 rounded-full bg-fcn-primary/20 px-1.5 text-[10px] font-bold">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="max-h-[70vh] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <Bell className="h-8 w-8 text-fcn-primary/30" />
                    <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                      {GROUP_EMPTY_MESSAGES[activeGroup] || "You're all caught up!"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-fcn-primary/5">
                    {filtered.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onRead={markOneRead}
                        compact
                      />
                    ))}
                  </div>
                )}

                <Link
                  to="/notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1 border-t border-fcn-primary/10 px-4 py-2.5 text-xs font-medium text-fcn-primary hover:bg-fcn-primary/5"
                >
                  See all notifications
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

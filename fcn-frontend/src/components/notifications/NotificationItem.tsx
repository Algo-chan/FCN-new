import { motion, useReducedMotion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarPlus, CalendarCheck, CalendarX, Bell, Video, CheckCircle, CalendarClock,
  MessageCircle, Pill, AlertTriangle, Sparkles, TestTube, AlertCircle, RefreshCw,
  XCircle, ShoppingBag, Clock, UserCheck, UserX, UserPlus, Heart, Star, Eye
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/auth.store";
import { NOTIFICATION_META } from "@/constants/notifications";
import type { Notification } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  CalendarPlus, CalendarCheck, CalendarX, Bell, Video, CheckCircle, CalendarClock,
  MessageCircle, Pill, AlertTriangle, Sparkles, TestTube, AlertCircle, RefreshCw,
  XCircle, ShoppingBag, Clock, UserCheck, UserX, UserPlus, Heart, Star
};

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  compact?: boolean;
}

export const NotificationItem = ({ notification, onRead, compact = false }: NotificationItemProps) => {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useAuthStore((state) => state.user ? true : false);

  const meta = NOTIFICATION_META[notification.type];
  const IconComponent = meta ? iconMap[meta.icon] || Bell : Bell;
  const iconColor = meta?.color || "#0A7EA4";

  const priorityBorder = notification.priority === "critical"
    ? "border-l-fcn-danger"
    : notification.priority === "high"
      ? "border-l-fcn-warning"
      : "border-l-transparent";

  const priorityBg = notification.priority === "critical" && !notification.read
    ? "bg-fcn-danger/5"
    : notification.priority === "high" && !notification.read
      ? "bg-fcn-warning/5"
      : notification.read
        ? ""
        : "bg-fcn-primary/[0.02]";

  const handleClick = () => {
    if (onRead && !notification.read) {
      onRead(notification.id);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  return (
    <motion.div
      initial={{ opacity: shouldReduceMotion ? 1 : 0, x: shouldReduceMotion ? 0 : -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: shouldReduceMotion ? 1 : 0, height: shouldReduceMotion ? "auto" : 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
      className={clsx(
        `relative flex cursor-pointer gap-3 border-l-3 border-l-transparent py-3 pl-4 pr-3 transition-colors hover:bg-fcn-primary/[0.04]`,
        priorityBorder,
        priorityBg
      )}
      onClick={handleClick}
    >
      <div
        className="flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: compact ? 36 : 40,
          height: compact ? 36 : 40,
          backgroundColor: `${iconColor}18`
        }}
      >
        <IconComponent
          className={compact ? "h-4 w-4" : "h-5 w-5"}
          style={{ color: iconColor }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={clsx(
            "truncate",
            notification.read ? "text-sm text-fcn-text-light/70 dark:text-fcn-text-dark/70" : "text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark"
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          {notification.message.length > (compact ? 60 : 80)
            ? `${notification.message.slice(0, compact ? 60 : 80)}...`
            : notification.message}
        </p>
        <p className="mt-1 text-[11px] text-fcn-text-light/30 dark:text-fcn-text-dark/30">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-center justify-start gap-1 pt-1">
        {!notification.read && (
          <motion.div
            initial={{ scale: shouldReduceMotion ? 1 : 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: shouldReduceMotion ? 1 : 0, opacity: shouldReduceMotion ? 1 : 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
            className="h-2 w-2 rounded-full bg-fcn-primary"
          />
        )}
        {notification.action_url && (
          <Eye className="h-3 w-3 text-fcn-text-light/20 dark:text-fcn-text-dark/20" />
        )}
      </div>
    </motion.div>
  );
};

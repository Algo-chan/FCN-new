import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X, ExternalLink } from "lucide-react";
import type { MessagePayload } from "@/config/firebase";

interface ForegroundNotificationToastProps {
  title: string;
  body: string;
  payload: MessagePayload;
  onDismiss: () => void;
}

export const ForegroundNotificationToast = ({ title, body, payload, onDismiss }: ForegroundNotificationToastProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(100);
  const duration = 6000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onDismiss]);

  const handleClick = () => {
    const actionUrl = payload.data?.actionUrl;
    if (actionUrl) {
      window.location.href = actionUrl;
    }
    onDismiss();
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={shouldReduceMotion ? {} : { x: "100%", opacity: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 25 }}
      className="relative w-80 overflow-hidden rounded-xl border border-fcn-primary/20 bg-white shadow-lg dark:bg-fcn-dark"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3 p-3">
        <img
          src="/logo/fcn-logo-full.png"
          alt="FCN"
          className="mt-0.5 h-6 w-auto shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
            {title}
          </p>
          <p className="mt-0.5 truncate text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            {body}
          </p>
          {payload.data?.actionUrl && (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-fcn-primary">
              <ExternalLink className="h-3 w-3" />
              View details
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="shrink-0 rounded-md p-1 text-fcn-text-light/40 hover:bg-fcn-primary/10 hover:text-fcn-primary dark:text-fcn-text-dark/40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <motion.div
        className="h-0.5 bg-fcn-accent"
        initial={{ width: "100%" }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.05, ease: "linear" }}
      />
    </motion.div>
  );
};

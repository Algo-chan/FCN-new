import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Check, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ExtensionApprovalModalProps {
  isOpen: boolean;
  doctorName: string;
  requestedMinutes: number;
  onApprove: (minutes: number) => void;
  onDecline: () => void;
}

export const ExtensionApprovalModal = ({
  isOpen,
  doctorName,
  requestedMinutes = 10,
  onApprove,
  onDecline
}: ExtensionApprovalModalProps) => {
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(60);
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onDecline]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-teal-500/30 p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-white relative overflow-hidden"
        >
          {/* Top Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400 font-bold shrink-0">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Extension Request
              </span>
              <h3 className="text-base font-black tracking-tight leading-snug">
                Doctor requested +{requestedMinutes} min
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            <strong>{doctorName}</strong> is requesting a <strong>{requestedMinutes}-minute extension</strong> to finish reviewing your clinical care and answer any questions.
          </p>

          {/* 60s Auto-dismiss bar */}
          <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 60, ease: "linear" }}
              className="h-full bg-teal-500"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-4">
            <span>Auto-dismisses in {secondsRemaining}s</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={onDecline}
              className="w-full min-h-[44px] font-bold"
            >
              <X className="h-4 w-4 mr-1 text-slate-400" />
              <span>Wrap Up</span>
            </Button>

            <Button
              variant="action"
              size="sm"
              onClick={() => onApprove(requestedMinutes)}
              className="w-full min-h-[44px] font-bold shadow-md"
            >
              <Check className="h-4 w-4 mr-1 text-teal-200" />
              <span>Approve +{requestedMinutes}m</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

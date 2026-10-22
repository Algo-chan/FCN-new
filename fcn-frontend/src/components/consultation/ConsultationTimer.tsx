import { useState, useEffect } from "react";
import { Clock, AlertTriangle, Plus } from "lucide-react";
import { clsx } from "clsx";

interface ConsultationTimerProps {
  startedAt?: string | null;
  durationMinutes: number;
  isReadOnly: boolean;
  isDoctor: boolean;
  onRequestExtension?: (minutes: number) => void;
  isExtending?: boolean;
}

export const ConsultationTimer = ({
  startedAt,
  durationMinutes = 15,
  isReadOnly,
  isDoctor,
  onRequestExtension,
  isExtending = false
}: ConsultationTimerProps) => {
  const calculateRemaining = () => {
    if (!startedAt) {
      return durationMinutes * 60;
    }
    const startMs = new Date(startedAt).getTime();
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    return Math.max(0, durationMinutes * 60 - elapsedSecs);
  };

  const [secondsLeft, setSecondsLeft] = useState<number>(calculateRemaining);

  useEffect(() => {
    setSecondsLeft(calculateRemaining());
  }, [startedAt, durationMinutes]);

  useEffect(() => {
    if (isReadOnly) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isReadOnly]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

  const isLowTime = secondsLeft < 120;
  const isMedTime = secondsLeft <= 300 && !isLowTime;

  // Determine Duration Tier badge
  const tierLabel =
    durationMinutes <= 15
      ? "General (15m)"
      : durationMinutes <= 30
        ? "Specialist (30m)"
        : `Complex (${durationMinutes}m)`;

  return (
    <div className="flex items-center gap-2">
      {/* Duration Tier Pill */}
      <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border border-slate-200 dark:border-white/10">
        {tierLabel}
      </span>

      {/* Live Countdown Badge */}
      <div
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all tabular-nums select-none shadow-xs",
          isLowTime
            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse"
            : isMedTime
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
              : "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/25"
        )}
        title={
          isMedTime
            ? "Session ending in less than 5 minutes"
            : isLowTime
              ? "Session ending soon"
              : "Remaining consultation session time"
        }
      >
        {isMedTime || isLowTime ? (
          <AlertTriangle className="h-3.5 w-3.5 text-current shrink-0" />
        ) : (
          <Clock className="h-3.5 w-3.5 text-current shrink-0" />
        )}
        <span>{timeFormatted}</span>
      </div>

      {/* Doctor Extension Button */}
      {isDoctor && !isReadOnly && onRequestExtension && (
        <button
          type="button"
          onClick={() => onRequestExtension(10)}
          disabled={isExtending}
          className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/25 transition-all active:scale-95 disabled:opacity-50"
          title="Request a 10-minute session extension"
        >
          <Plus className="h-3 w-3" />
          <span>+10m</span>
        </button>
      )}
    </div>
  );
};

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  Calendar,
  Stethoscope,
  Video,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Volume2,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InitialsAvatar } from "@/components/profile/InitialsAvatar";
import { useSound } from "@/hooks/useSound";

interface ConsultationWaitingRoomProps {
  appointment: {
    id: string;
    scheduled_at: string;
    duration_minutes?: number;
    appointment_type?: string;
    chief_complaint?: string | null;
    doctor?: {
      id?: string;
      full_name: string;
      specialty?: string | null;
      photo_url?: string | null;
      rating_average?: number;
      years_experience?: number;
    };
  };
  timeLock: {
    opensAt?: string;
    scheduledAt?: string;
    earlyBufferMinutes?: number;
  };
  onOpen?: () => void;
}

export const ConsultationWaitingRoom: React.FC<ConsultationWaitingRoomProps> = ({
  appointment,
  timeLock,
  onOpen
}) => {
  const { playSuccess, playNotification } = useSound();
  const scheduledDate = parseISO(timeLock.scheduledAt || appointment.scheduled_at);
  const opensDate = timeLock.opensAt
    ? parseISO(timeLock.opensAt)
    : new Date(scheduledDate.getTime() - 10 * 60 * 1000);

  const calculateRemaining = () => {
    const diff = Math.max(0, Math.floor((opensDate.getTime() - Date.now()) / 1000));
    const days = Math.floor(diff / (24 * 3600));
    const hours = Math.floor((diff % (24 * 3600)) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return { total: diff, days, hours, minutes, seconds };
  };

  const [remaining, setRemaining] = useState(calculateRemaining());
  const [soundTested, setSoundTested] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const updated = calculateRemaining();
      setRemaining(updated);

      if (updated.total <= 0) {
        clearInterval(interval);
        playSuccess();
        if (onOpen) onOpen();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [opensDate, onOpen, playSuccess]);

  const handleTestSound = () => {
    playNotification();
    setSoundTested(true);
    setTimeout(() => setSoundTested(false), 2000);
  };

  const doctorName = appointment.doctor?.full_name ?? "Specialist Physician";
  const doctorSpecialty = appointment.doctor?.specialty ?? "General Practice";

  return (
    <div className="min-h-full h-full overflow-y-auto flex flex-col items-center justify-center px-4 py-8 sm:py-12 bg-slate-50/60 dark:bg-slate-950/80">
      <div className="w-full max-w-2xl space-y-6">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/appointments"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Appointments</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-3 py-1 rounded-full border border-teal-500/20">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping" />
            <span>Virtual Waiting Room</span>
          </span>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-teal-500/20 bg-gradient-to-br from-white via-teal-50/20 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-teal-950/20 p-6 sm:p-8 shadow-xl text-center">
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          {/* Squircle Badge */}
          <div className="mx-auto mb-4 relative">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 mx-auto items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25 ring-4 ring-teal-500/10">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Consultation Not Yet Started
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            To respect the doctor's schedule and privacy, consultation rooms open{" "}
            <strong className="text-slate-700 dark:text-slate-200">10 minutes before</strong> your
            booked appointment time.
          </p>

          {/* Live Countdown Display */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-3">
              Room Opens In
            </p>

            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm mx-auto">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 p-2.5 sm:p-3 shadow-sm">
                <span className="font-mono text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
                  {String(remaining.days).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                  Days
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 p-2.5 sm:p-3 shadow-sm">
                <span className="font-mono text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
                  {String(remaining.hours).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                  Hours
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 p-2.5 sm:p-3 shadow-sm">
                <span className="font-mono text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
                  {String(remaining.minutes).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                  Mins
                </span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 p-2.5 sm:p-3 shadow-sm">
                <span className="font-mono text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
                  {String(remaining.seconds).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                  Secs
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Scheduled start:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {format(scheduledDate, "EEEE, MMMM d, yyyy • h:mm a")}
              </strong>
            </p>
          </div>
        </div>

        {/* Doctor & Appointment Summary Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <InitialsAvatar name={doctorName} size="lg" role="doctor" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Dr. {doctorName}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-500/20 px-2 py-0.5 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                  <ShieldCheck className="h-3 w-3" />
                  Verified Physician
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {doctorSpecialty}
                {appointment.doctor?.years_experience ? ` • ${appointment.doctor.years_experience} yrs experience` : ""}
              </p>

              {appointment.chief_complaint && (
                <div className="mt-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Reason for visit:{" "}
                  </span>
                  {appointment.chief_complaint}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preparation Checklist */}
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm space-y-3">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-500" />
            <span>How to prepare while you wait:</span>
          </h4>

          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
              <span>Ensure your phone or laptop has stable internet or 2G/3G mobile data.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
              <span>Have any previous paper lab tests, photos, or prescription bottles nearby.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
              <span>Stay in a quiet, well-lit room for clear audio and camera visibility.</span>
            </li>
          </ul>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-white/5">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestSound}
              icon={<Volume2 className="h-4 w-4" />}
            >
              {soundTested ? "Speaker Working!" : "Test Audio Chime"}
            </Button>

            <span className="text-[11px] text-slate-400">
              This page will automatically admit you when the room opens.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

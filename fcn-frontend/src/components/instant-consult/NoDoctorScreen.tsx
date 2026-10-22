import { motion } from "framer-motion";
import { Users, Clock, Sparkles, Phone, AlertTriangle, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { InitialsAvatar } from "@/components/profile/InitialsAvatar";
import type { MatchedDoctor } from "@/services/instant-consult.service";

interface NoDoctorScreenProps {
  queuePosition: number;
  estimatedWaitMinutes: number;
  nextAvailableDoctors: MatchedDoctor[];
  onLeaveQueue: () => void;
  onClose: () => void;
}

export const NoDoctorScreen = ({
  queuePosition,
  estimatedWaitMinutes,
  nextAvailableDoctors,
  onLeaveQueue,
  onClose
}: NoDoctorScreenProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center select-none relative z-10 max-w-lg mx-auto w-full space-y-4">
      {/* Live Queue Position Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-3xl bg-slate-900/90 border border-teal-500/30 p-5 shadow-2xl backdrop-blur-xl text-left"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
            <span>Live Priority Queue</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">Position updated real-time</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 font-black text-2xl border border-teal-500/30">
              #{queuePosition}
            </div>
            <div>
              <p className="text-sm font-bold text-white">You are #{queuePosition} in line</p>
              <p className="text-xs text-teal-200/80 font-medium mt-0.5">
                First available doctor will be assigned to you automatically.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300">
              <Clock className="h-3.5 w-3.5 text-teal-400" />
              <span>Est. Wait</span>
            </div>
            <p className="text-lg font-black text-white">~{estimatedWaitMinutes} min</p>
          </div>
        </div>
      </motion.div>

      {/* AI Symptom Check While Waiting CTA */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full rounded-3xl bg-gradient-to-r from-sky-500/20 via-teal-500/15 to-transparent border border-sky-400/25 p-4 text-left flex items-center justify-between gap-3 backdrop-blur-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white">
              Check symptoms with AI while waiting?
            </h4>
            <p className="text-[11px] text-slate-300">
              Pre-fill clinical summary for your doctor in 60s.
            </p>
          </div>
        </div>

        <Link
          to="/ai-check"
          onClick={onClose}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-sky-300 hover:text-white transition-colors bg-sky-500/20 px-3 py-1.5 rounded-xl border border-sky-400/30"
        >
          <span>Start</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </motion.div>

      {/* Next Available Doctors Preview (if any) */}
      {nextAvailableDoctors && nextAvailableDoctors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full rounded-3xl bg-slate-900/60 border border-white/10 p-4 text-left"
        >
          <p className="text-xs font-bold text-slate-300 mb-2.5">
            Specialists on call in Dire Dawa:
          </p>
          <div className="space-y-2">
            {nextAvailableDoctors.slice(0, 2).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/[0.04] border border-white/5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 shrink-0 rounded-xl overflow-hidden ring-1 ring-white/10">
                    {doc.doctor_profile?.photo_url ? (
                      <img
                        src={doc.doctor_profile.photo_url}
                        alt={doc.full_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <InitialsAvatar name={doc.full_name} size="sm" role="doctor" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Dr. {doc.full_name}</p>
                    <p className="text-[10px] text-teal-300 truncate">
                      {doc.doctor_profile?.specialty}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                  Next in rotation
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Emergency Hotlines (Always Visible) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-left"
      >
        <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold mb-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Is this an acute emergency?</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-tight">
          If you are experiencing chest pain, severe bleeding, or trouble breathing, call immediately:
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-black text-white">
          <a
            href="tel:907"
            className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 px-2.5 py-1 text-rose-200 border border-rose-500/30"
          >
            <Phone className="h-3 w-3" />
            <span>Ambulance: 907</span>
          </a>
          <a
            href="tel:991"
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1 text-slate-200 border border-white/15"
          >
            <Phone className="h-3 w-3" />
            <span>Police: 991</span>
          </a>
          <a
            href="tel:+251251112020"
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2.5 py-1 text-slate-200 border border-white/15"
          >
            <span>Dil Chora Hospital</span>
          </a>
        </div>
      </motion.div>

      {/* Leave Queue Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onLeaveQueue}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          <span>Leave Queue & Browse Directory</span>
        </button>
      </div>
    </div>
  );
};

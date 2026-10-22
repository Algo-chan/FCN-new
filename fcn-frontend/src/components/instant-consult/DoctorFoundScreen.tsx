import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, ShieldCheck, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react";
import { InitialsAvatar } from "@/components/profile/InitialsAvatar";
import type { MatchedDoctor } from "@/services/instant-consult.service";

interface DoctorFoundScreenProps {
  doctor: MatchedDoctor | null;
  onReady: () => void;
  allergiesNote: string;
  onAllergiesChange: (note: string) => void;
}

const COMMON_ALLERGIES = ["None", "Penicillin", "Sulfa drugs", "Aspirin/NSAIDs"];

export const DoctorFoundScreen = ({
  doctor,
  onReady,
  allergiesNote,
  onAllergiesChange
}: DoctorFoundScreenProps) => {
  const [countdown, setCountdown] = useState(3);
  const [selectedPill, setSelectedPill] = useState<string>(allergiesNote || "None");
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // 3-second transition timer to Screen 3
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onReady();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onReady]);

  const handleSelectPill = (pill: string) => {
    setSelectedPill(pill);
    if (pill === "None") {
      onAllergiesChange("No known allergies reported");
      setShowCustom(false);
    } else {
      onAllergiesChange(pill);
    }
  };

  const handleCustomChange = (val: string) => {
    setCustomInput(val);
    onAllergiesChange(val);
  };

  const doctorName = doctor?.full_name ? `Dr. ${doctor.full_name}` : "Your Doctor";
  const specialty = doctor?.doctor_profile?.specialty || "General Medicine Specialist";
  const rating = Number(doctor?.doctor_profile?.rating_average ?? 4.9).toFixed(1);
  const photoUrl = doctor?.doctor_profile?.photo_url;
  const firstName = doctor?.full_name?.split(" ")[0] || "Doctor";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center select-none relative z-10 max-w-lg mx-auto w-full">
      {/* Success Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "backOut" }}
        className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs sm:text-sm font-extrabold text-emerald-300 border border-emerald-400/30 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.3)]"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <span>Doctor Found!</span>
      </motion.div>

      {/* Main Doctor Found Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full rounded-3xl bg-slate-900/80 border border-teal-500/30 p-5 sm:p-6 shadow-2xl backdrop-blur-xl text-left relative overflow-hidden"
      >
        {/* Ambient Top Glow inside card */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-teal-400/20 blur-xl pointer-events-none" />

        <div className="flex items-start gap-4">
          {/* Doctor Avatar */}
          <div className="relative shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={doctorName}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 ring-teal-400/40 shadow-md"
              />
            ) : (
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl ring-2 ring-teal-400/40 overflow-hidden shadow-md">
                <InitialsAvatar name={doctor?.full_name || "Doctor"} size="lg" role="doctor" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white shadow-sm ring-2 ring-slate-900">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Name & Specialty Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                {doctorName}
              </h3>
              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs shrink-0 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                <Star className="h-3 w-3 fill-amber-400" />
                <span>{rating}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-teal-300 mt-0.5 truncate">
              {specialty}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ready now</span>
              </span>
              <span className="text-[11px] text-slate-300">Fast Care Certified</span>
            </div>
          </div>
        </div>

        {/* Doctor Quote Greeting */}
        <div className="mt-4 rounded-2xl bg-white/[0.04] border border-white/5 p-3.5 flex items-start gap-2.5">
          <MessageSquare className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
            &ldquo;Hello! I&apos;m Dr. {firstName}. I am ready to review your symptoms and take care of you right away.&rdquo;
          </p>
        </div>

        {/* Optional Allergy Quick-Check */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-teal-200 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-teal-400" />
              <span>Any allergies to mention? (Optional)</span>
            </span>
            <span className="text-[11px] text-slate-400">Quick tap</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {COMMON_ALLERGIES.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => handleSelectPill(pill)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  selectedPill === pill
                    ? "bg-teal-500 text-white shadow-sm ring-1 ring-teal-300"
                    : "bg-white/10 text-slate-300 hover:bg-white/15"
                }`}
              >
                {pill}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowCustom(!showCustom)}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-white/5 text-slate-400 hover:text-white border border-white/10"
            >
              + Other
            </button>
          </div>

          {showCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2"
            >
              <input
                type="text"
                placeholder="Type allergies or medications..."
                value={customInput}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* 3-Second Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full mt-6 space-y-2"
      >
        <div className="flex items-center justify-between text-xs font-bold text-teal-200">
          <span>Connecting to consultation room...</span>
          <span className="tabular-nums font-black text-white">{countdown}s</span>
        </div>

        <div className="h-2.5 w-full rounded-full bg-slate-950/60 overflow-hidden border border-white/10 p-0.5">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
            className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.6)]"
          />
        </div>
      </motion.div>
    </div>
  );
};

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { StethoscopeAnimation } from "./StethoscopeAnimation";
import { Button } from "@/components/ui/Button";

interface FindingDoctorScreenProps {
  onCancel: () => void;
  chiefComplaint?: string;
}

const REASSURANCE_MESSAGES = [
  "Searching verified Ethiopian specialists ready right now...",
  "Checking active clinic connections & video bandwidth...",
  "Consultations start in ~5 minutes with zero clinic queue...",
  "Average doctor connection speed: under 3 minutes..."
];

export const FindingDoctorScreen = ({ onCancel, chiefComplaint }: FindingDoctorScreenProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  // Haptic feedback on mount
  useEffect(() => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(200);
      }
    } catch {
      // Haptics unsupported or blocked
    }
  }, []);

  // 4s interval rotating reassurance messages
  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % REASSURANCE_MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center select-none relative z-10">
      {/* Center Animated Breathing Stethoscope */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mb-8"
      >
        <StethoscopeAnimation />
      </motion.div>

      {/* Primary Action Title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
      >
        Finding your doctor...
      </motion.h2>

      {/* Chief complaint chip if provided */}
      {chiefComplaint && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-medium text-teal-200 border border-white/10 backdrop-blur-md max-w-sm truncate"
        >
          <Sparkles className="h-3 w-3 text-teal-300 shrink-0" />
          <span className="truncate">Need: {chiefComplaint}</span>
        </motion.div>
      )}

      {/* Rotating Reassurance Crossfade */}
      <div className="h-14 mt-4 flex items-center justify-center max-w-md px-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="text-sm sm:text-base text-teal-100/90 font-medium leading-relaxed drop-shadow-sm"
          >
            {REASSURANCE_MESSAGES[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Micro Progress Indicator Dots */}
      <div className="mt-4 flex items-center gap-2">
        {REASSURANCE_MESSAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === messageIndex ? "w-6 bg-teal-400" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>

      {/* Cancel Search Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="mt-10"
      >
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 px-5 py-2 text-xs sm:text-sm font-semibold text-white/80 hover:text-white border border-white/15 transition-all shadow-sm"
        >
          <X className="h-4 w-4" />
          <span>Cancel Search</span>
        </button>
      </motion.div>
    </div>
  );
};

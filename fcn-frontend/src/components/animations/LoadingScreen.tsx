import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { animate } from "animejs";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const shouldReduceMotion = useReducedMotion();
  const heartbeatRef = useRef<SVGPathElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"heartbeat" | "glow" | "done">("heartbeat");

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => onComplete(), 1800);
    return () => clearTimeout(timer);
  }, [onComplete, shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || !heartbeatRef.current) return;

    const path = heartbeatRef.current;
    const length = path.getTotalLength();

    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);

    const anim = animate(path, {
      strokeDashoffset: [length, 0],
      duration: 1200,
      easing: "easeInOut",
      onComplete: () => setPhase("glow")
    });

    return () => { void anim.cancel(); };
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion || phase !== "glow" || !glowRef.current) return;

    animate(glowRef.current, {
      boxShadow: [
        "0 0 0 rgba(45, 212, 191, 0)",
        "0 0 40px rgba(45, 212, 191, 0.6)",
        "0 0 0 rgba(45, 212, 191, 0)"
      ],
      duration: 500,
      easing: "easeInOut"
    });
  }, [phase, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#0D1117] via-[#0A2540] to-fcn-primary"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }}
      />

      {/* Logo */}
      <div
        ref={logoRef}
        className="relative mb-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <img
            src="/logo/fcn-logo-full.png"
            alt="FCN"
            className="h-14 w-auto"
          />
        </motion.div>
        <div
          ref={glowRef}
          className="absolute inset-0 rounded-lg"
        />
      </div>

      {/* Heartbeat line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="w-48 sm:w-64"
      >
        <svg viewBox="0 0 200 30" className="w-full">
          <path
            ref={heartbeatRef}
            d="M0,15 L40,15 L60,15 L75,15 L82,3 L90,27 L98,8 L106,22 L114,15 L130,15 L200,15"
            fill="none"
            stroke="#2DD4BF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* Loading text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0.5, 1] }}
        transition={{ delay: 0.4, duration: 1.4, times: [0, 0.2, 0.6, 0.8, 1] }}
        className="mt-4 text-sm text-white/50"
      >
        Loading your healthcare...
      </motion.p>
    </motion.div>
  );
};

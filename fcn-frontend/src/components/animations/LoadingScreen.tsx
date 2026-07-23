import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { LogoAnimation } from "@/components/animations/LogoAnimation";

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"logo" | "done">("logo");

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete();
      return;
    }
    // Auto-dismiss after logo animation completes + small buffer
    const timer = setTimeout(() => {
      setPhase("done");
      setTimeout(onComplete, 400);
    }, 1400);
    return () => clearTimeout(timer);
  }, [onComplete, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="loading-screen"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
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

        {/* Animated logo with SVG stroke reveal + heartbeat */}
        <LogoAnimation size={90} />

        {/* Loading text with pulse */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0.5, 1] }}
          transition={{ delay: 0.6, duration: 1.2, times: [0, 0.2, 0.6, 0.8, 1] }}
          className="mt-6 text-sm tracking-wider text-white/40"
        >
          Foundation Care Network
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};

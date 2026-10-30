import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Activity, ShieldCheck, Sparkles, X } from "lucide-react";

export const SPLASH_SHOWN_KEY = "fcn_splash_shown_v1";

interface LifelineSplashScreenProps {
  /**
   * Duration in milliseconds before smoothly transitioning to the landing page.
   * Defaults to 2100ms.
   */
  durationMs?: number;
  /**
   * If true, forces the splash screen to play even if previously shown in this session.
   */
  forcePlay?: boolean;
}

export const LifelineSplashScreen: React.FC<LifelineSplashScreenProps> = ({
  durationMs = 2100,
  forcePlay = false
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Determine initial visibility: show if forcePlay is true, or if not yet shown in this session
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (shouldReduceMotion) return false;
    if (forcePlay) return true;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("splash") === "1") return true;
    return sessionStorage.getItem(SPLASH_SHOWN_KEY) !== "1";
  });

  const [beatCount, setBeatCount] = useState(72);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    // Increment BPM slightly for realistic heart rate monitor fluctuation
    const bpmInterval = setInterval(() => {
      setBeatCount((prev) => 70 + Math.floor(Math.random() * 5));
    }, 600);

    // Auto-dismiss after the lifeline sweep finishes
    const timer = setTimeout(() => {
      handleDismiss();
    }, durationMs);

    return () => {
      clearInterval(bpmInterval);
      clearTimeout(timer);
    };
  }, [isVisible, durationMs]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SPLASH_SHOWN_KEY, "1");
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  // Clinical ECG Multi-Cycle Path: spans full width (viewBox 0 0 1200 100)
  // Rhythms: baseline -> P wave -> PR -> Q dip -> massive R spike -> deep S plunge -> ST -> T wave -> repeats across screen
  const ecgPath =
    "M 0 50 L 150 50 " +
    // Beat 1 (Left)
    "C 165 50, 175 42, 185 42 C 195 42, 205 50, 220 50 L 250 50 " +
    "L 262 58 L 278 8 L 294 88 L 306 50 L 325 50 " +
    "C 340 50, 355 36, 370 36 C 385 36, 400 50, 420 50 L 500 50 " +
    // Beat 2 (Center - hits right under logo)
    "C 520 50, 532 40, 545 40 C 558 40, 570 50, 590 50 L 620 50 " +
    "L 634 62 L 652 4 L 672 94 L 686 50 L 710 50 " +
    "C 728 50, 746 34, 764 34 C 782 34, 800 50, 824 50 L 900 50 " +
    // Beat 3 (Right)
    "C 915 50, 925 42, 935 42 C 945 42, 955 50, 970 50 L 995 50 " +
    "L 1007 58 L 1023 10 L 1039 86 L 1051 50 L 1070 50 " +
    "C 1085 50, 1100 38, 1115 38 C 1130 38, 1145 50, 1165 50 L 1200 50";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="fcn-lifeline-splash"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.02,
            filter: "blur(4px)",
            transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] }
          }}
          className="fixed inset-0 z-[9999] flex flex-col justify-between bg-black text-white overflow-hidden select-none cursor-pointer"
          onClick={handleDismiss}
          title="Click anywhere to skip"
        >
          {/* ── 1. Medical ICU Grid Background ─────────────────────── */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="ecg-grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#2DD4BF" strokeWidth="0.5" />
                </pattern>
                <pattern id="ecg-grid-large" width="100" height="100" patternUnits="userSpaceOnUse">
                  <rect width="100" height="100" fill="url(#ecg-grid-small)" />
                  <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#2DD4BF" strokeWidth="1.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#ecg-grid-large)" />
            </svg>
          </div>

          {/* Vignette & Radial Glow */}
          <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-teal-950/20 via-transparent to-black opacity-80" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[130px]" />

          {/* ── 2. Top ICU Cardiac Monitor HUD ─────────────────────── */}
          <header className="relative z-10 flex items-center justify-between p-6 sm:px-10">
            {/* Left: Patient Monitor Vitals */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 font-mono text-xs sm:text-sm tracking-wider text-emerald-400">
                <Heart className="h-4 w-4 animate-ping fill-emerald-400 text-emerald-400" />
                <span className="font-bold text-white text-base">{beatCount}</span>
                <span className="text-emerald-500/80 text-[11px]">BPM</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-teal-400/80">
                <Activity className="h-3.5 w-3.5" />
                <span>LEAD II • ECG NORMAL SINUS</span>
              </div>
            </div>

            {/* Right: Hospital System & Skip Button */}
            <div className="flex items-center gap-4">
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-950/40 px-3 py-1 font-mono text-[11px] text-teal-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DIRE DAWA HEALTHCARE NETWORK
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="group flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
              >
                <span>Skip</span>
                <X className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
              </button>
            </div>
          </header>

          {/* ── 3. Center Section: Brand & Running Lifeline ────────── */}
          <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
            {/* Center Brand Identity (Beats rhythmically with the center ECG spike) */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{
                scale: [0.92, 1, 1.05, 1, 1.04, 1],
                opacity: 1
              }}
              transition={{
                duration: 1.8,
                times: [0, 0.2, 0.45, 0.6, 0.75, 1],
                ease: "easeInOut"
              }}
              className="flex flex-col items-center text-center mb-6"
            >
              {/* Logo with ambient neon glow */}
              <div className="relative mb-4">
                <div className="absolute -inset-4 rounded-3xl bg-teal-500/20 blur-xl animate-pulse" />
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-2xl border border-teal-400/30 bg-black/60 p-2 shadow-2xl backdrop-blur-md">
                  <img
                    src="/fcn-brand/png/icon-192.png"
                    alt="Fast Care Now"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>

              {/* Title & Tagline */}
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                <span>FAST CARE NOW</span>
                <Sparkles className="h-5 w-5 text-teal-400 animate-pulse" />
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-teal-200/70 font-medium tracking-wide">
                Ethiopia's First Digital Healthcare Network
              </p>
            </motion.div>

            {/* ── 4. The Running Medical Lifeline ──────────────────── */}
            <div className="relative w-full max-w-5xl h-24 sm:h-28 overflow-hidden select-none pointer-events-none">
              <svg
                viewBox="0 0 1200 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
                className="w-full h-full block"
              >
                <defs>
                  {/* Neon Glow Filter */}
                  <filter id="splash-lifeline-glow" x="-20%" y="-100%" width="140%" height="300%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  {/* Gradient for the running pulse beam */}
                  <linearGradient id="splash-pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0A7EA4" stopOpacity="0" />
                    <stop offset="30%" stopColor="#0EA5E9" stopOpacity="0.4" />
                    <stop offset="70%" stopColor="#2DD4BF" stopOpacity="0.9" />
                    <stop offset="95%" stopColor="#FFFFFF" stopOpacity="1" />
                    <stop offset="100%" stopColor="#5EEAD4" stopOpacity="1" />
                  </linearGradient>

                  {/* Subtle static track */}
                  <linearGradient id="splash-track-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.05" />
                    <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* 1. Underlying baseline ECG path */}
                <path
                  d={ecgPath}
                  stroke="url(#splash-track-grad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* 2. Intense Glowing Ambient Trail */}
                <path
                  ref={pathRef}
                  d={ecgPath}
                  pathLength={1000}
                  stroke="url(#splash-pulse-grad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#splash-lifeline-glow)"
                  className="animate-splash-lifeline"
                  style={{ strokeDasharray: "280 1000" }}
                />

                {/* 3. Crisp Diamond-White Core Ray */}
                <path
                  d={ecgPath}
                  pathLength={1000}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-splash-lifeline"
                  style={{ strokeDasharray: "280 1000" }}
                />
              </svg>

              {/* Glowing Pulse Dot that sweeps across */}
              <div className="absolute inset-y-0 w-full pointer-events-none">
                <div className="animate-splash-blip absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-[0_0_15px_4px_#2DD4BF]" />
              </div>
            </div>
          </main>

          {/* ── 5. Bottom Monitor Diagnostics ─────────────────────── */}
          <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 p-6 sm:px-10 font-mono text-[11px] text-teal-400/70 border-t border-teal-500/10">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300">SYSTEM: ALL CLINICAL NODES OPERATIONAL</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <span>DIRE DAWA • HARAR • ADDIS ABABA</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">24/7 INSTANT CARE</span>
            </div>
          </footer>

          {/* Keyframe Styles for the running lifeline sweep */}
          <style>{`
            @keyframes splashLifelineSweep {
              0% {
                stroke-dashoffset: 280;
                opacity: 0;
              }
              5% {
                opacity: 1;
              }
              95% {
                opacity: 1;
              }
              100% {
                stroke-dashoffset: -1000;
                opacity: 0;
              }
            }

            @keyframes splashBlipSweep {
              0% {
                left: 0%;
                opacity: 0;
              }
              5% {
                opacity: 1;
              }
              95% {
                opacity: 1;
              }
              100% {
                left: 100%;
                opacity: 0;
              }
            }

            .animate-splash-lifeline {
              animation: splashLifelineSweep 2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
            }

            .animate-splash-blip {
              animation: splashBlipSweep 2s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  Sparkles,
  Stethoscope,
  Activity,
  ShieldCheck,
  Building2,
  Clock,
  HeartPulse,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";

gsap.registerPlugin(ScrollTrigger);

const particles = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: 10 + i * 11,
  y: 15 + (i * 23) % 70,
  size: 3 + (i % 3) * 2,
}));

interface SymptomPreset {
  id: string;
  name: string;
  icon: string;
  severity: "Emergency" | "Caution" | "Mild";
  severityColor: string;
  recommendation: string;
  suggestedAction: string;
  actionPath: string;
}

const PRESETS: SymptomPreset[] = [
  {
    id: "fever",
    name: "High Fever (39°C)",
    icon: "🌡️",
    severity: "Caution",
    severityColor: "text-amber-300 bg-amber-500/20 border-amber-500/40",
    recommendation: "Virtual Doctor consultation recommended. Keep hydrated.",
    suggestedAction: "Consult Doctor Now",
    actionPath: "/doctors",
  },
  {
    id: "chest",
    name: "Chest Pressure",
    icon: "💓",
    severity: "Emergency",
    severityColor: "text-rose-300 bg-rose-500/20 border-rose-500/40",
    recommendation: "Dil Chora Hospital ER is open with available ICU capacity.",
    suggestedAction: "Check Emergency Beds",
    actionPath: "/hospitals",
  },
  {
    id: "migraine",
    name: "Severe Headache",
    icon: "🤕",
    severity: "Mild",
    severityColor: "text-emerald-300 bg-emerald-500/20 border-emerald-500/40",
    recommendation: "AI triage analysis and over-the-counter dosage guidance.",
    suggestedAction: "Run Free AI Check",
    actionPath: "/ai-check",
  },
];

export const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();
  const { playTransition } = useSound();
  const heartbeatRef = useRef<SVGPathElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<SymptomPreset>(PRESETS[0]);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const ctx = gsap.context(() => {
      // Infinite ECG heartbeat trace
      if (heartbeatRef.current) {
        const length = heartbeatRef.current.getTotalLength();
        gsap.set(heartbeatRef.current, { strokeDasharray: length, strokeDashoffset: 0 });
        gsap.to(heartbeatRef.current, {
          strokeDashoffset: -length,
          duration: 3.5,
          ease: "none",
          repeat: -1,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [shouldReduceMotion]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0B0F15] via-[#0D1824] to-[#0A2E33] text-white"
    >
      {/* Subtle background technical grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient ECG heartbeat line */}
      <svg
        className="absolute left-0 top-1/2 -translate-y-1/2 w-full opacity-10 pointer-events-none"
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
      >
        <path
          ref={heartbeatRef}
          d="M0,30 L250,30 L380,30 L400,30 L415,8 L430,52 L445,16 L460,44 L475,25 L490,35 L510,30 L1200,30"
          fill="none"
          stroke="#2DD4BF"
          strokeWidth="2.5"
        />
      </svg>

      {/* Floating subtle ambient particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-teal-400/20 blur-[1px]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-10 px-4 pt-24 pb-16 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:pt-24 lg:pb-16">
        {/* Left Column: Mission & Core Actions */}
        <div className="flex-1 text-center lg:text-left">
          {/* Live Regional Pill */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-300 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>🇪🇹 Dire Dawa's Live Healthcare Network</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[2.25rem] sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08]"
          >
            Hospital-Grade Care,{" "}
            <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              Right In Your Pocket.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-3.5 sm:mt-4 text-sm sm:text-base leading-relaxed text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal"
          >
            Instant clinical AI triage, licensed Ethiopian doctors on video or voice, nurse-dispatched doorstep test kits, and real-time hospital ICU bed tracking.
          </motion.p>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-xs font-semibold text-teal-300/80"
          >
            ጤና ለሁሉም • ፈጣን የህክምና እርዳታ
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center lg:justify-start"
          >
            <Link to="/ai-check" onClick={() => playTransition()} className="flex-1 sm:flex-none">
              <Button
                size="lg"
                variant="action"
                className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(20,184,166,0.35)]"
              >
                <Sparkles className="h-4 w-4 text-teal-200" />
                <span>Start Free AI Check</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>

            <Link to="/doctors" onClick={() => playTransition()} className="flex-1 sm:flex-none">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white border-white/20 backdrop-blur-md"
              >
                <Stethoscope className="h-4 w-4 text-teal-300" />
                <span>Consult a Doctor</span>
              </Button>
            </Link>
          </motion.div>

          {/* Real-time Trust Highlights */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              <span>50+ Licensed MDs</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-sky-400" />
              <span>3 Partner Hospitals</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>&lt; 4m Average Wait</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Interactive Live Clinical Intelligence Card (Replaces the fake phone mockup) */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md flex-1"
        >
          <div className="relative rounded-3xl border border-white/15 bg-slate-900/70 p-4 sm:p-5 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            {/* Top Card Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white tracking-tight leading-tight">Live Clinical Hub</p>
                  <p className="text-[10px] text-teal-300/80 font-medium">Dire Dawa Central Node</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE NOW</span>
              </div>
            </div>

            {/* Interactive Symptom Tester Header */}
            <div className="mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-teal-400" />
                <span>Interactive AI Severity Demo</span>
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                Tap a symptom to see real-time triage recommendation:
              </p>
            </div>

            {/* Symptom Selectors */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {PRESETS.map((preset) => {
                const isActive = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={clsx(
                      "flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all select-none border text-xs",
                      isActive
                        ? "bg-teal-500/20 border-teal-400 text-white font-bold shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                    )}
                  >
                    <span className="text-base mb-1">{preset.icon}</span>
                    <span className="text-[10px] leading-tight truncate max-w-full font-semibold">
                      {preset.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Clinical Triage Preview Box */}
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3 sm:p-3.5 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-400">Assessed Urgency:</span>
                <span
                  className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                    selectedPreset.severityColor
                  )}
                >
                  {selectedPreset.severity}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-snug">
                {selectedPreset.recommendation}
              </p>
              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-teal-300 font-medium">Recommended Next Step:</span>
                <Link
                  to={selectedPreset.actionPath}
                  onClick={() => playTransition()}
                  className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                >
                  <span>{selectedPreset.suggestedAction}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Live Hospital Occupancy Mini-Feed */}
            <div className="rounded-xl bg-white/5 p-2.5 border border-white/5 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-200 font-semibold truncate">Dil Chora General Hospital</p>
                  <p className="text-[10px] text-emerald-400 font-medium">6 ICU Beds • ER Active</p>
                </div>
              </div>
              <Link
                to="/hospitals"
                className="text-[10px] font-bold text-slate-400 hover:text-teal-300 underline shrink-0 ml-2"
              >
                All Hospitals →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Micro scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 pointer-events-none opacity-60"
      >
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Scroll to explore</span>
        <ChevronDown className="h-4 w-4 text-slate-400 animate-bounce" />
      </motion.div>
    </section>
  );
};

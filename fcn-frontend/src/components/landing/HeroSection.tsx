import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import {
  ArrowRight,
  Play,
  Stethoscope,
  Activity,
  Building2,
  ShieldCheck,
  Clock,
  Lock,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";

const particles = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  x: 10 + i * 11,
  y: 15 + (i * 23) % 70,
  size: 3 + (i % 3) * 2,
}));

export const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();
  const { playTransition } = useSound();
  const heartbeatRef = useRef<SVGPathElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const ctx = gsap.context(() => {
      // Gentle ECG trace in background
      if (heartbeatRef.current) {
        const length = heartbeatRef.current.getTotalLength();
        gsap.set(heartbeatRef.current, { strokeDasharray: length, strokeDashoffset: 0 });
        gsap.to(heartbeatRef.current, {
          strokeDashoffset: -length,
          duration: 3.8,
          ease: "none",
          repeat: -1,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [shouldReduceMotion]);

  const handleHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0B0F15] via-[#0D1824] to-[#0A2E33] text-white flex flex-col justify-between"
    >
      {/* Background technical grid */}
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
          d="M0,30 L280,30 L400,30 L415,8 L430,52 L445,16 L460,44 L475,25 L490,35 L510,30 L1200,30"
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

      {/* Hero Content Container */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center gap-10 px-4 pt-24 pb-14 sm:px-6 lg:flex-row lg:items-center lg:gap-12 lg:px-8">
        {/* Left Column: Psychological Reassurance & Mission */}
        <div className="flex-1 text-center lg:text-left">
          {/* Regional indicator */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-300 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>🇪🇹 Dire Dawa's Live Telehealth Network</span>
          </motion.div>

          {/* Main Headline (Concept 1: Relief & Peace of Mind) */}
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white"
          >
            Doctor Care & Instant Answers,{" "}
            <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              When You Need Them Most.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mx-auto mb-2 max-w-lg text-sm sm:text-base leading-relaxed text-slate-300 lg:mx-0 font-normal"
          >
            Check symptoms with AI in 30 seconds, consult certified Ethiopian doctors by video or phone, and have nurse visits or digital prescriptions delivered to your door.
          </motion.p>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="mb-6 text-xs font-semibold text-teal-300/80"
          >
            ጤና ለሁሉም • ፈጣን የህክምና እርዳታ
          </motion.p>

          {/* Dual Action Buttons */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3"
          >
            <Link to="/register" onClick={() => playTransition()} className="flex-1 sm:flex-none">
              <Button
                size="lg"
                variant="action"
                className="w-full sm:w-auto flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(20,184,166,0.35)]"
              >
                <span>Get Care Now</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <a href="#how-it-works" onClick={handleHowItWorks} className="flex-1 sm:flex-none">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white border-white/20 backdrop-blur-md"
              >
                <Play className="h-4 w-4 text-teal-300" />
                <span>Watch How It Works</span>
              </Button>
            </a>
          </motion.div>

          {/* Trust Highlights */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400"
          >
            <span>🏥 3 Partner Hospitals</span>
            <span className="text-white/20">•</span>
            <span>👨‍⚕️ 50+ Verified Doctors</span>
            <span className="text-white/20">•</span>
            <span>⭐ 4.8 Patient Rating</span>
          </motion.div>
        </div>

        {/* Right Column: Reassurance Clinical Peace-of-Mind Card (Replaces fake phone mockup) */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-md flex-1"
        >
          <div className="relative rounded-3xl border border-white/15 bg-slate-900/70 p-5 sm:p-6 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] text-left">
            {/* Top Doctor Presence Badge */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-teal-400/40">
                  ST
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white leading-tight">Dr. Sara Tadesse</p>
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                  </div>
                  <p className="text-[11px] text-slate-300">General Physician &amp; Pediatrics</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ON DUTY</span>
              </div>
            </div>

            {/* Language Reassurance */}
            <div className="mb-4 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px] text-slate-300">
              <span className="text-slate-400">Consultation Languages:</span>
              <span className="font-semibold text-teal-300">English • አማርኛ • Afaan Oromoo</span>
            </div>

            {/* The 3 Care Pillars (Quiet & Clear) */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <div className="h-8 w-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Instant Doctor Consultation</p>
                  <p className="text-[11px] text-slate-300 leading-snug">Connect via video, phone, or secure chat in under 4 minutes.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Home Nurse Dispatch</p>
                  <p className="text-[11px] text-slate-300 leading-snug">Licensed nurse arrives at your door for sample collection and vitals check.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <div className="h-8 w-8 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Hospital ICU &amp; Bed Visibility</p>
                  <p className="text-[11px] text-slate-300 leading-snug">Real-time emergency bed tracking at Dil Chora &amp; Sabian hospitals.</p>
                </div>
              </div>
            </div>

            {/* Bottom Confidentiality & Response Time */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-teal-400" />
                <span>100% Confidential Care</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Avg Wait: ~3 mins</span>
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Subtle Scroll Hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="pb-4 hidden md:flex flex-col items-center gap-1 pointer-events-none opacity-50"
      >
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Scroll to explore</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 animate-bounce" />
      </motion.div>
    </section>
  );
};

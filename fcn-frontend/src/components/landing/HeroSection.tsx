import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import {
  ArrowRight,
  Sparkles,
  Stethoscope,
  Building2,
  ShieldCheck,
  Clock,
  Lock,
  ChevronDown,
} from "lucide-react";
import { useSound } from "@/hooks/useSound";
import { clsx } from "clsx";

const particles = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  x: 12 + i * 16,
  y: 20 + (i * 27) % 60,
  size: 3 + (i % 2) * 2,
}));

const ACTION_CARDS = [
  {
    title: "Consult a Doctor",
    badge: "50+ Verified MDs",
    badgeColor: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    description: "Book secure video, voice, or text consultations with certified Ethiopian physicians.",
    icon: Stethoscope,
    iconColor: "text-teal-300 bg-teal-500/20",
    link: "/doctors",
    cta: "Find a Doctor",
    featured: false,
  },
  {
    title: "AI Symptom Check",
    badge: "Instant • Free",
    badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    description: "Describe symptoms in English, አማርኛ, or Afaan Oromoo for instant clinical urgency guidance.",
    icon: Sparkles,
    iconColor: "text-emerald-300 bg-emerald-500/20",
    link: "/ai-check",
    cta: "Start Free Assessment",
    featured: true,
  },
  {
    title: "Hospital & ICU Status",
    badge: "Live Capacity",
    badgeColor: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    description: "Check real-time ICU and emergency bed availability before traveling to Dire Dawa hospitals.",
    icon: Building2,
    iconColor: "text-sky-300 bg-sky-500/20",
    link: "/hospitals",
    cta: "View Live Tracker",
    featured: false,
  },
];

export const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();
  const { playTransition } = useSound();
  const heartbeatRef = useRef<SVGPathElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const ctx = gsap.context(() => {
      // Subtle ambient heartbeat trace
      if (heartbeatRef.current) {
        const length = heartbeatRef.current.getTotalLength();
        gsap.set(heartbeatRef.current, { strokeDasharray: length, strokeDashoffset: 0 });
        gsap.to(heartbeatRef.current, {
          strokeDashoffset: -length,
          duration: 4,
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
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0B0F15] via-[#0C1622] to-[#0A2E33] text-white flex flex-col justify-between"
    >
      {/* Subtle technical background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Ambient ECG heartbeat trace */}
      <svg
        className="absolute left-0 top-1/2 -translate-y-1/2 w-full opacity-[0.08] pointer-events-none"
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
      >
        <path
          ref={heartbeatRef}
          d="M0,30 L300,30 L450,30 L470,10 L485,50 L500,20 L515,40 L530,28 L550,30 L1200,30"
          fill="none"
          stroke="#2DD4BF"
          strokeWidth="2"
        />
      </svg>

      {/* Ambient particles */}
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

      {/* Main Hero Container */}
      <div className="relative z-10 mx-auto max-w-6xl w-full px-4 pt-28 pb-12 sm:px-6 lg:px-8 my-auto text-center">
        {/* Regional Indicator */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-semibold text-teal-300 backdrop-blur-md"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>🇪🇹 Dire Dawa's Telehealth & Emergency Network</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] max-w-4xl mx-auto"
        >
          Quality Healthcare in Dire Dawa,{" "}
          <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
            Simplified.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mt-3.5 sm:mt-4 text-sm sm:text-base leading-relaxed text-slate-300 max-w-2xl mx-auto font-normal"
        >
          Hospital-backed telemedicine, instant AI clinical assessments, doorstep nurse visits, and live emergency ICU bed tracking—all in one place.
        </motion.p>

        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
          className="mt-2 text-xs font-semibold text-teal-300/80"
        >
          ጤና ለሁሉም • ፈጣን የህክምና እርዳታ
        </motion.p>

        {/* Concept 2: The Direct 3-Problem Solver Cards */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 text-left max-w-5xl mx-auto"
        >
          {ACTION_CARDS.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              onClick={() => playTransition()}
              className={clsx(
                "group relative flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition-all duration-200 select-none",
                "backdrop-blur-xl text-left active:scale-[0.98]",
                card.featured
                  ? "bg-gradient-to-b from-teal-500/15 via-teal-500/5 to-white/5 border-teal-500/40 shadow-[0_8px_32px_rgba(20,184,166,0.18)] hover:border-teal-400 hover:shadow-[0_12px_40px_rgba(20,184,166,0.25)]"
                  : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 shadow-sm"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={clsx(
                      "h-11 w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
                      card.iconColor
                    )}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={clsx(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-bold border tracking-tight",
                      card.badgeColor
                    )}
                  >
                    {card.badge}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                  {card.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  {card.description}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-teal-400 group-hover:text-teal-300 transition-colors">
                <span>{card.cta}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Quiet Reassurance Trust Line */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <span>Hospital-Backed Network</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-sky-400" />
            <span>Average Doctor Wait &lt; 4 mins</span>
          </div>
          <span className="text-white/20">•</span>
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-emerald-400" />
            <span>Encrypted Health Records</span>
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

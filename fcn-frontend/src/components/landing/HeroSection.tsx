import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ArrowRight, ChevronDown, Play, Sparkles } from "lucide-react";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";

const particles = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 3 + Math.random() * 4,
  duration: 4 + Math.random() * 6,
  delay: Math.random() * 4
}));

const words = ["Healthcare", "Without", "Walls"];

export const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();
  const { playTransition } = useSound();
  const [notif1, setNotif1] = useState(false);
  const [notif2, setNotif2] = useState(false);
  const heartbeatRef = useRef<SVGPathElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const ctx = gsap.context(() => {
      // Heartbeat line infinite draw
      if (heartbeatRef.current) {
        const length = heartbeatRef.current.getTotalLength();
        gsap.set(heartbeatRef.current, { strokeDasharray: length, strokeDashoffset: 0 });
        gsap.to(heartbeatRef.current, {
          strokeDashoffset: -length,
          duration: 3,
          ease: "none",
          repeat: -1
        });
      }

      // Floating particles
      particlesRef.current?.querySelectorAll(".particle").forEach((el) => {
        gsap.to(el, {
          y: -30 - Math.random() * 20,
          opacity: 0.3 + Math.random() * 0.4,
          duration: 3 + Math.random() * 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 3
        });
      });

      // Phone floating
      if (phoneRef.current) {
        gsap.to(phoneRef.current, {
          y: -8,
          rotation: -1.5,
          duration: 4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1
        });
      }
    }, sectionRef);

    // Floating notifications after delay
    const t1 = setTimeout(() => setNotif1(true), 2000);
    const t2 = setTimeout(() => setNotif2(true), 3500);

    return () => {
      ctx.revert();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [shouldReduceMotion]);

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0D1117] via-[#0A2540] to-fcn-primary">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Animated heartbeat */}
      <svg className="absolute left-0 top-1/2 w-full opacity-[0.08]" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path ref={heartbeatRef} d="M0,30 L200,30 L400,30 L500,30 L520,5 L540,55 L560,15 L580,45 L600,25 L620,35 L640,30 L1200,30" fill="none" stroke="#2DD4BF" strokeWidth="2" />
      </svg>

      {/* Particles */}
      <div ref={particlesRef} className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div key={p.id} className="particle absolute rounded-full bg-fcn-accent/30" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s` }} />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center gap-8 px-4 pt-28 pb-12 sm:px-6 lg:flex-row lg:px-8">
        {/* Left column */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-fcn-accent/20 px-4 py-1.5 text-xs font-medium text-fcn-accent"
          >
            <motion.span
              animate={shouldReduceMotion ? {} : { scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              🇪🇹
            </motion.span>
            Now Live in Dire Dawa, Ethiopia
          </motion.div>

          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {words.map((word, i) => (
              <motion.span
                key={word}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldReduceMotion ? 0 : 0.2 + i * 0.15, duration: shouldReduceMotion ? 0 : 0.5 }}
                className={`mr-3 inline-block ${word === "Walls" ? "bg-gradient-to-r from-fcn-primary to-fcn-accent bg-clip-text text-transparent" : "text-white"}`}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.6 }}
            className="mx-auto mb-2 max-w-lg text-sm leading-relaxed text-gray-300 sm:text-base lg:mx-0"
          >
            Get a full hospital experience from home. Remote consultation, AI-powered health checks, nurse-dispatched home visits, and e-prescriptions — all on one platform built for Ethiopia.
          </motion.p>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.8 }}
            className="mb-6 text-sm italic text-fcn-accent/80"
          >
            ጤና ለሁሉም
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.9 }}
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap sm:gap-4"
          >
            <Link to="/register" onClick={() => playTransition()}>
              <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-fcn-primary to-fcn-accent text-white shadow-lg shadow-fcn-accent/25 hover:shadow-fcn-accent/40">
                  Get Care Now
                  <motion.span className="ml-2 inline-block" whileHover={shouldReduceMotion ? {} : { x: 3 }}><ArrowRight className="h-4 w-4" /></motion.span>
                </Button>
              </motion.div>
            </Link>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" }); }}>
              <Button variant="ghost" size="lg" className="w-full sm:w-auto text-white hover:bg-white/10">
                <Play className="mr-2 h-4 w-4" /> Watch How It Works
              </Button>
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 1.2 }}
            className="mt-8 flex flex-wrap items-center gap-3 text-xs text-gray-400 sm:gap-4 sm:text-sm"
          >
            <span>🏥 3 Partner Hospitals</span>
            <span className="hidden sm:inline">·</span>
            <span>👨‍⚕️ 50+ Doctors</span>
            <span className="hidden sm:inline">·</span>
            <span>⭐ 4.8 Rating</span>
          </motion.div>
        </div>

        {/* Right column — Phone mockup */}
        <div className="hidden flex-1 sm:block">
          <div ref={phoneRef} className="mx-auto w-64 sm:w-72" style={{ willChange: "transform" }}>
            <div className="rounded-[2.5rem] border-4 border-gray-600 bg-gray-900 p-3 shadow-2xl">
              <div className="overflow-hidden rounded-[2rem] bg-white dark:bg-[#0D1117]">
                {/* Phone top bar */}
                <div className="bg-gradient-to-r from-fcn-primary to-fcn-accent px-4 py-5">
                  <p className="text-xs font-medium text-white/80">Good morning 👋</p>
                  <p className="text-lg font-bold text-white">Welcome back</p>
                </div>

                {/* Mini dashboard */}
                <div className="space-y-2 p-3">
                  <div className="rounded-lg bg-fcn-accent/10 p-2.5">
                    <p className="text-[10px] font-medium text-fcn-accent">Next Appointment</p>
                    <p className="text-xs font-bold text-fcn-text-light dark:text-fcn-text-dark">Today, 2:00 PM</p>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1 rounded-lg bg-fcn-primary/10 p-2.5 text-center">
                      <p className="text-xs font-bold text-fcn-primary">2</p>
                      <p className="text-[9px] text-fcn-text-light/60 dark:text-fcn-text-dark/60">Visits</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-fcn-warning/10 p-2.5 text-center">
                      <p className="text-xs font-bold text-fcn-warning">1</p>
                      <p className="text-[9px] text-fcn-text-light/60 dark:text-fcn-text-dark/60">Pending</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-fcn-success/10 p-2.5 text-center">
                      <p className="text-xs font-bold text-fcn-success">4</p>
                      <p className="text-[9px] text-fcn-text-light/60 dark:text-fcn-text-dark/60">Meds</p>
                    </div>
                  </div>

                  {/* Doctor preview */}
                  <div className="flex items-center gap-2 rounded-lg border border-fcn-primary/10 p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fcn-accent text-[10px] font-bold text-white">ST</div>
                    <div>
                      <p className="text-[11px] font-medium text-fcn-text-light dark:text-fcn-text-dark">Dr. Sara T.</p>
                      <p className="text-[9px] text-fcn-text-light/50 dark:text-fcn-text-dark/50">General Physician</p>
                    </div>
                    <span className="ml-auto text-[10px] font-medium text-fcn-accent">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notifications */}
      <AnimatePresence>
        {notif1 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="pointer-events-none absolute bottom-32 right-4 z-20 hidden rounded-2xl bg-white px-4 py-3 shadow-xl dark:bg-[#111827] lg:block"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
              ✅ Appointment confirmed
            </p>
          </motion.div>
        )}
        {notif2 && (
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            className="pointer-events-none absolute bottom-48 left-4 z-20 hidden rounded-2xl bg-white px-4 py-3 shadow-xl dark:bg-[#111827] lg:block"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark">
              🩺 Nurse arriving at 2pm
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center"
      >
        <motion.div animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <ChevronDown className="mx-auto h-5 w-5 text-white/40" />
        </motion.div>
        <p className="mt-1 text-[10px] text-white/30">Scroll to explore</p>
      </motion.div>
    </section>
  );
};
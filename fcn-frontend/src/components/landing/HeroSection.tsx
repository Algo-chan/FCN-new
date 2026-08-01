import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ArrowRight, ChevronDown, Smartphone } from "lucide-react";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const particles = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 3 + Math.random() * 4,
  duration: 4 + Math.random() * 6,
  delay: Math.random() * 4
}));

const words = ["Healthcare", "Without", "Walls"];

const stats = [
  { value: "3+", label: "Hospitals in Dire Dawa" },
  { value: "4", label: "Languages AI Support" },
  { value: "FREE", label: "Pilot Period" },
  { value: "50 ETB", label: "per consult" }
];

const features = [
  { icon: "🏥", label: "Remote Consultation" },
  { icon: "🤖", label: "AI in 4 Languages" },
  { icon: "💊", label: "E-Prescriptions" },
  { icon: "🏠", label: "Nurse Home Visits" },
  { icon: "📊", label: "Health Records" },
  { icon: "🔍", label: "Hospital Checker" }
];

const doctors = [
  { initials: "ST", name: "Dr. Sara" },
  { initials: "YA", name: "Dr. Yonas" },
  { initials: "MK", name: "Dr. Meron" }
];

export const HeroSection = () => {
  const shouldReduceMotion = useReducedMotion();
  const { playTransition } = useSound();
  const [notif1, setNotif1] = useState(false);
  const [notif2, setNotif2] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const heartbeatRef = useRef<SVGPathElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (!installPrompt) {
      return;
    }
    void installPrompt.prompt();
    setInstallPrompt(null);
  };

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

      // Floating particles (slightly more visible)
      particlesRef.current?.querySelectorAll(".particle").forEach((el) => {
        gsap.to(el, {
          y: -30 - Math.random() * 20,
          opacity: 0.4 + Math.random() * 0.3,
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

  const socialProofCard = (delay: number, className = "") => (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: shouldReduceMotion ? 0 : delay, duration: 0.5 }}
      className={`w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-md lg:text-left ${className}`}
    >
      <p className="text-xs text-gray-300">Trusted by healthcare professionals in Dire Dawa</p>
      <div className="mt-3 flex items-center justify-center gap-3 lg:justify-start">
        <div className="flex">
          {doctors.map((d) => (
            <div
              key={d.initials}
              title={d.name}
              className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fcn-accent to-fcn-primary text-[11px] font-bold text-white ring-2 ring-[#0A1628] first:ml-0"
            >
              {d.initials}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400">Join 50+ doctors already on FCN</p>
      </div>
    </motion.div>
  );

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0D1117 0%, #0A1628 40%, #0A2540 70%, #0A7EA4 100%)"
      }}
    >
      {/* Background grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,126,164,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(10,126,164,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Animated heartbeat */}
      <svg className="absolute left-0 top-1/2 w-full opacity-[0.08]" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path ref={heartbeatRef} d="M0,30 L200,30 L400,30 L500,30 L520,5 L540,55 L560,15 L580,45 L600,25 L620,35 L640,30 L1200,30" fill="none" stroke="#2DD4BF" strokeWidth="2" />
      </svg>

      {/* Particles */}
      <div ref={particlesRef} className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div key={p.id} className="particle absolute rounded-full bg-fcn-accent/40" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s` }} />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center gap-8 px-4 pb-12 pt-20 sm:px-6 md:pt-24 lg:px-8">
        {/* Two-column split */}
        <div className="flex w-full flex-col items-center gap-10 md:flex-row md:gap-12">
          {/* LEFT — Top content */}
          <div className="flex w-full flex-col items-center text-center md:w-[55%] md:items-start md:text-left">
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
              className="mb-2 max-w-lg text-sm leading-relaxed text-gray-300 sm:text-base"
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
              className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-4"
            >
              <Link to="/register" onClick={() => playTransition()} className="w-full md:w-auto">
                <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" className="w-full bg-gradient-to-r from-fcn-primary to-fcn-accent text-white shadow-lg shadow-fcn-accent/25 hover:shadow-fcn-accent/40 md:w-auto">
                    Get Care Now
                    <motion.span className="ml-2 inline-block" whileHover={shouldReduceMotion ? {} : { x: 3 }}><ArrowRight className="h-4 w-4" /></motion.span>
                  </Button>
                </motion.div>
              </Link>
              <Link to="/login" onClick={() => playTransition()} className="w-full md:w-auto">
                <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" variant="ghost" className="w-full border border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10 md:w-auto">
                    Sign In
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Social proof (desktop) */}
            {socialProofCard(1, "mt-8 hidden md:block")}
          </div>

          {/* RIGHT — Phone mockup */}
          <div className="hidden md:block md:w-[45%]">
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

        {/* Bottom stack — fills the blank area */}
        <div className="flex w-full flex-col items-center gap-6">
          {/* SECTION A — Install App Banner */}
          {installPrompt && (
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : 1.3 }}
              className="w-full max-w-md animate-pulse-border rounded-2xl border-2 border-fcn-accent/40 bg-white/5 p-4 backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fcn-accent/15">
                  <Smartphone className="h-5 w-5 text-fcn-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">📱 Install FCN as an App</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-300">
                    Add to your home screen for the best experience — works offline too
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstall}
                className="mt-3 rounded-md border border-fcn-accent/40 bg-fcn-accent/10 px-4 py-1.5 text-xs font-medium text-fcn-accent transition hover:bg-fcn-accent/20"
              >
                Install Now
              </motion.button>
            </motion.div>
          )}

          {/* SECTION B — Quick Stats Row */}
          <motion.div className="grid w-full max-w-xl grid-cols-2 gap-3 md:max-w-none md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.value}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldReduceMotion ? 0 : 1 + i * 0.1, duration: 0.4 }}
                className="relative rounded-xl bg-white/5 p-4"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-gradient-to-r from-fcn-primary to-fcn-accent" />
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-[11px] leading-snug text-white/50">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* SECTION C — Feature Pills Row */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: shouldReduceMotion ? 0 : 1.6, duration: 0.5 }}
            className="hide-scrollbar w-full overflow-x-auto pb-1"
          >
            <div className="flex w-max gap-2 px-0.5">
              {features.map((f) => (
                <span
                  key={f.label}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-[20px] border border-fcn-primary/30 bg-fcn-primary/15 px-3.5 py-2 text-xs text-fcn-accent"
                >
                  <span>{f.icon}</span>
                  {f.label}
                </span>
              ))}
            </div>
          </motion.div>

          {/* SECTION D — Social Proof Card (mobile) */}
          {socialProofCard(2, "md:hidden")}

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-2 text-center"
          >
            <motion.div animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <ChevronDown className="mx-auto h-5 w-5 text-white/40" />
            </motion.div>
            <p className="mt-1 text-[10px] text-white/30">Scroll to explore</p>
          </motion.div>
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
    </section>
  );
};

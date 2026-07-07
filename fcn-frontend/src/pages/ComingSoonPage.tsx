import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useCountdown } from "@/hooks/useCountdown";
import { clsx } from "clsx";

const TARGET_DATE = "2026-07-15T00:00:00+03:00";

const WORDS = ["Healthcare", "Without", "Walls"];

const FEATURES = [
  { icon: "🏥", title: "Remote Consultations", desc: "See a doctor from home via chat, voice or video" },
  { icon: "🤖", title: "AI Health Check", desc: "Describe symptoms in Amharic, Somali, Oromo or English" },
  { icon: "💊", title: "E-Prescriptions", desc: "Digital prescriptions delivered to partner pharmacies" }
];

export default function ComingSoonPage() {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(TARGET_DATE);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ekgRef = useRef<SVGPathElement>(null);
  const prevRef = useRef({ days, hours, minutes, seconds });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx2d = canvasEl.getContext("2d")!;

    let animId: number;
    let particles: Particle[] = [];

    const cvs: HTMLCanvasElement = canvasEl;

    function resize() {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 50; i++) {
      particles.push(createParticle(cvs.width, cvs.height));
    }

    function draw() {
      ctx2d.clearRect(0, 0, cvs.width, cvs.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulsePhase += 0.02;

        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > cvs.width) { p.x = cvs.width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > cvs.height) { p.y = cvs.height; p.vy *= -1; }

        const pulse = 1 + Math.sin(p.pulsePhase) * 0.3;
        const r = p.radius * (0.8 + pulse * 0.2);
        const alpha = Math.min(1, p.opacity * (0.8 + Math.sin(p.pulsePhase) * 0.2));

        ctx2d.beginPath();
        ctx2d.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx2d.fillStyle = p.color;
        ctx2d.globalAlpha = alpha;
        ctx2d.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx2d.beginPath();
            ctx2d.moveTo(particles[i].x, particles[i].y);
            ctx2d.lineTo(particles[j].x, particles[j].y);
            ctx2d.strokeStyle = "#0A7EA4";
            ctx2d.globalAlpha = (1 - dist / 100) * 0.15;
            ctx2d.lineWidth = 0.5;
            ctx2d.stroke();
          }
        }
      }

      ctx2d.globalAlpha = 1;
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (ekgRef.current) {
      const length = ekgRef.current.getTotalLength();
      gsap.set(ekgRef.current, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(ekgRef.current, {
        strokeDashoffset: 0,
        duration: 4,
        repeat: -1,
        ease: "none"
      });
    }
  }, []);

  function flipClass(current: number, prev: number, key: string) {
    return current !== prev ? key : "";
  }

  useEffect(() => {
    prevRef.current = { days, hours, minutes, seconds };
  });

  function formatNum(n: number) {
    return String(n).padStart(2, "0");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("https://api.fcncare.com/api/v1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        throw new Error(data.error?.message || "Something went wrong");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0D1117] flex flex-col items-center justify-center overflow-hidden px-6 py-10">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />

      <div className="fixed bottom-0 left-0 w-full h-[33vh] z-0 pointer-events-none opacity-[0.06]">
        <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className="w-full h-full">
          <path
            ref={ekgRef}
            d="M0,200 L100,200 L120,200 L140,200 L160,200 L180,200 L200,200 L220,200 L240,200 L260,200 L280,200 L300,200 L320,200 L340,200 L360,200 L380,200 L400,200 L420,200 L440,200 L460,200 L480,200 L500,200 L520,200 L540,200 L560,200 L580,200 L600,200 L620,200 L640,200 L660,200 L680,200 L700,200 L720,200 L740,200 L760,200 L780,200 L800,200 L820,200 L840,200 L860,200 L880,200 L900,200 L920,200 L940,200 L960,200 L980,200 L1000,200 L1020,200 L1040,200 L1060,200 L1080,200 L1100,200 L1120,200 L1140,200 L1160,200 L1180,200 L1200,200"
            fill="none"
            stroke="#2DD4BF"
            strokeWidth="3"
          />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <img
            src="/logo/fcn-logo-full.png"
            alt="FCN Logo"
            className="h-20 md:h-20 sm:h-15"
            style={{ filter: "drop-shadow(0 0 20px rgba(10,126,164,0.4))" }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-6"
        >
          <p className="text-xs tracking-[4px] uppercase text-fcn-primary font-semibold">
            Foundation Care Network
          </p>
          <p className="text-sm italic text-gray-200 mt-1">
            Compassion. Connection. Care.
          </p>
        </motion.div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white text-center leading-tight mb-5 max-w-4xl">
          {WORDS.map((word, i) => (
            <motion.span
              key={word}
              className="inline-block mr-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + i * 0.15 }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-[#94A3B8] text-base sm:text-lg text-center max-w-xl leading-relaxed mb-3"
        >
          Ethiopia's first complete digital healthcare platform is launching in Dire Dawa.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-fcn-accent italic text-sm sm:text-base mb-10"
        >
          ጤና ለሁሉም — Health for All
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-12 w-full max-w-xl"
        >
          {[
            { label: "Days", value: days },
            { label: "Hours", value: hours },
            { label: "Minutes", value: minutes },
            { label: "Seconds", value: seconds }
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 1.5 + 0.1 * ["Days","Hours","Minutes","Seconds"].indexOf(item.label) }}
              className="bg-[#1E293B] border border-fcn-primary rounded-xl px-3 py-4 text-center"
            >
              <FlipNumber
                value={formatNum(item.value)}
                prev={formatNum(prevRef.current[item.label.toLowerCase() as keyof typeof prevRef.current])}
              />
              <p className="text-[11px] tracking-[2px] uppercase text-[#64748B] mt-2">
                {item.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.0 }}
          className="w-full max-w-md mb-12"
        >
          <p className="text-xs tracking-[2px] uppercase text-fcn-accent text-center mb-3">
            Be the first to know when we launch
          </p>

          {submitted ? (
            <div className="text-center">
              <h3 className="text-xl text-fcn-accent font-semibold mb-2">✅ You're on the list!</h3>
              <p className="text-sm text-[#94A3B8]">
                We'll email you at {email} when FCN launches on July 15, 2026
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 outline-none focus:border-fcn-primary transition-colors"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 outline-none focus:border-fcn-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-fcn-primary text-white font-semibold text-sm transition-all hover:bg-[#0E8FB8] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>Notify Me <span>→</span></>
                )}
              </button>
              {error && (
                <p className="text-sm text-fcn-danger text-center">{error}</p>
              )}
            </form>
          )}
        </motion.div>

        <p className="text-[11px] tracking-[2px] uppercase text-[#64748B] mb-4">
          What's coming:
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-12"
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.5 + i * 0.15 }}
              className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-xl p-6 text-center hover:border-fcn-primary/30 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h4 className="text-sm font-semibold text-white mb-2">{f.title}</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 3.0 }}
          className="text-center"
        >
          <p className="text-xs text-[#64748B] mb-2">
            &copy; 2026 Foundation Care Network — Dire Dawa, Ethiopia
          </p>
          <div className="flex justify-center gap-5 text-xs text-[#64748B]">
            <a href="#" className="hover:text-fcn-primary transition-colors">Facebook</a>
            <a href="#" className="hover:text-fcn-primary transition-colors">Twitter/X</a>
            <a href="#" className="hover:text-fcn-primary transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-fcn-primary transition-colors">Telegram</a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FlipNumber({ value, prev }: { value: string; prev: string }) {
  const isFlipping = value !== prev;
  return (
    <motion.span
      key={value}
      className="block text-3xl sm:text-4xl md:text-5xl font-bold text-white"
      initial={isFlipping ? { scaleY: 0 } : undefined}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{ transformOrigin: "top center" }}
    >
      {value}
    </motion.span>
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  opacity: number;
  pulsePhase: number;
}

function createParticle(w: number, h: number): Particle {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    radius: 2 + Math.random() * 2,
    color: Math.random() > 0.5 ? "#0A7EA4" : "#2DD4BF",
    opacity: 0.3 + Math.random() * 0.4,
    pulsePhase: Math.random() * Math.PI * 2
  };
}

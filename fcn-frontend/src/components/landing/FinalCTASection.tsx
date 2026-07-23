import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { animate } from "animejs";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";

const particles = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 3 + Math.random() * 4,
  delay: Math.random() * 4000,
  duration: 3000 + Math.random() * 3000
}));

export const FinalCTASection = () => {
  const shouldReduceMotion = useReducedMotion();
  const { playTransition } = useSound();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldReduceMotion || !sectionRef.current) return;

    const particleEls = sectionRef.current.querySelectorAll(".cta-particle");
    particleEls.forEach((el) => {
      animate(el, {
        translateY: [0, -(15 + Math.random() * 15), 0],
        opacity: [0.15, 0.4, 0.15],
        duration: 3000 + Math.random() * 3000,
        easing: "easeInOut",
        loop: true,
        delay: Math.random() * 3000
      });
    });
  }, [shouldReduceMotion]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-gradient-to-br from-fcn-primary to-fcn-accent py-12 px-4 sm:py-24 sm:px-6">
      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <div key={p.id} className="cta-particle absolute rounded-full bg-white/20" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }} />
        ))}
      </div>

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6"
      >
        <h2 className="mb-4 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">Ready to Experience Healthcare Without Walls?</h2>
        <p className="mb-8 text-sm text-white/80 sm:text-lg">Join thousands of patients and doctors already using FCN in Dire Dawa</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Link to="/register" onClick={() => playTransition()}>
            <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button className="w-full bg-white text-fcn-primary hover:bg-white/90 sm:w-auto">Get Started Free</Button>
            </motion.div>
          </Link>
          <a href="mailto:hello@fcn.health">
            <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button variant="ghost" className="w-full border border-white/40 text-white hover:bg-white/10 sm:w-auto">Talk to Our Team</Button>
            </motion.div>
          </a>
        </div>
        <p className="mt-8 text-xs italic text-white/60 sm:text-sm">ጤናዎ ቅድሚያ የምንሰጠው ነው</p>
      </motion.div>
    </section>
  );
};

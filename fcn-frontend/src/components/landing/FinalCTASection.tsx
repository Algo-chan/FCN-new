import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { useSound } from "@/hooks/useSound";
import { Button } from "@/components/ui/Button";

const particles = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 3 + Math.random() * 4,
  duration: 5 + Math.random() * 4,
  delay: Math.random() * 4
}));

export const FinalCTASection = () => {
  const shouldReduceMotion = useReducedMotion();
  const { playTransition } = useSound();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const ctx = gsap.context(() => {
      sectionRef.current?.querySelectorAll(".cta-particle").forEach((el) => {
        gsap.to(el, {
          y: -25 - Math.random() * 15,
          opacity: 0.4 + Math.random() * 0.3,
          duration: 3 + Math.random() * 3,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: Math.random() * 3
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [shouldReduceMotion]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-gradient-to-br from-fcn-primary to-fcn-accent py-24">
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
        className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6"
      >
        <h2 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">Ready to Experience Healthcare Without Walls?</h2>
        <p className="mb-8 text-lg text-white/80">Join thousands of patients and doctors already using FCN in Dire Dawa</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/register" onClick={() => playTransition()}>
            <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}>
              <Button className="bg-white text-fcn-primary hover:bg-white/90">Get Started Free</Button>
            </motion.div>
          </Link>
          <a href="mailto:hello@fcn.health">
            <Button variant="ghost" className="border border-white/40 text-white hover:bg-white/10">Talk to Our Team</Button>
          </a>
        </div>
        <p className="mt-8 text-sm italic text-white/60">ጤናዎ ቅድሚያ የምንሰጠው ነው</p>
      </motion.div>
    </section>
  );
};
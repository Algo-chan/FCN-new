import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { clsx } from "clsx";
import { Building2, GraduationCap, HeartPulse, Stethoscope, ShieldCheck } from "lucide-react";

const partners = [
  { name: "Dire Dawa General Hospital", icon: Building2, hue: 190 },
  { name: "Haramaya University Hospital", icon: GraduationCap, hue: 210 },
  { name: "Dil-Chora Referral Hospital", icon: HeartPulse, hue: 170 },
  { name: "Ethiopian Medical Association", icon: Stethoscope, hue: 200 },
  { name: "Ministry of Health Ethiopia", icon: ShieldCheck, hue: 180 }
];

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.09, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const }
  })
};

export const TrustBar = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      ref={sectionRef}
      id="trust"
      className="relative overflow-hidden rounded-t-3xl bg-white py-10 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:bg-fcn-dark dark:shadow-[0_-8px_30px_rgba(0,0,0,0.3)] sm:py-16"
    >
      {/* Shimmer effect */}
      <motion.div
        initial={shouldReduceMotion ? false : { x: "-100%" }}
        animate={isInView ? { x: "200%" } : {}}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-fcn-accent/8 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="mx-auto mb-3 block h-px w-12 bg-gradient-to-r from-transparent via-fcn-accent to-transparent" />
          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-fcn-primary/60 dark:text-fcn-accent/60"
          >
            Our Partners in Care
          </motion.p>
          <motion.h2
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mt-2 text-sm font-medium text-fcn-text-light/80 dark:text-fcn-text-dark/80 md:text-lg"
          >
            Trusted by leading healthcare institutions across{" "}
            <span className="text-fcn-primary dark:text-fcn-accent">Dire Dawa</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-5">
          {partners.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.name}
                custom={i}
                variants={shouldReduceMotion ? undefined : cardVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.02 }}
                className="group relative"
              >
                <div
                  className={clsx(
                    "relative overflow-hidden rounded-xl border bg-white/70 p-3 text-center shadow-sm backdrop-blur transition-all duration-300 dark:bg-fcn-dark/60 sm:px-5 sm:py-5",
                    "border-white/20 hover:border-fcn-accent/30 dark:border-white/5",
                    "hover:shadow-[0_12px_40px_rgba(10,126,164,0.12)] dark:hover:shadow-[0_12px_40px_rgba(45,212,191,0.08)]"
                  )}
                >
                  <div
                    className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-300 group-hover:shadow-[0_0_20px_rgba(10,126,164,0.15)] sm:mb-3 sm:h-11 sm:w-11"
                    style={{
                      backgroundColor: `hsla(${p.hue}, 70%, 45%, 0.1)`,
                      color: `hsl(${p.hue}, 70%, 45%)`
                    }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-medium leading-tight text-fcn-text-light dark:text-fcn-text-dark sm:text-sm">
                    {p.name}
                  </p>
                  <p className="mt-1 hidden text-[10px] text-fcn-text-light/40 dark:text-fcn-text-dark/40 sm:block">
                    Partner Institution
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-10 text-center text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40"
        >
          Serving over 50,000+ patients across the region
        </motion.p>
      </div>
    </section>
  );
};

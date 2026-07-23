import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Building2, GraduationCap, HeartPulse, ShieldCheck, Stethoscope, Users, Activity, Star } from "lucide-react";

const partners = [
  { name: "Dire Dawa General Hospital", icon: Building2, hue: 190 },
  { name: "Haramaya University Hospital", icon: GraduationCap, hue: 210 },
  { name: "Dil-Chora Referral Hospital", icon: HeartPulse, hue: 170 },
  { name: "Ethiopian Medical Association", icon: Stethoscope, hue: 200 },
  { name: "Ministry of Health Ethiopia", icon: ShieldCheck, hue: 180 }
];

const stats = [
  { value: "50K+", label: "Patients Served", icon: Users },
  { value: "3", label: "Partner Hospitals", icon: Building2 },
  { value: "50+", label: "Doctors", icon: Activity },
  { value: "4.8", label: "Avg Rating", icon: Star }
];

export const TrustBar = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    }
  };

  const statVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-y border-white/10 bg-gradient-to-b from-white/40 to-white/20 py-10 dark:from-white/[0.03] dark:to-white/[0.01]"
    >
      {/* Shimmer sweep */}
      <motion.div
        initial={shouldReduceMotion ? false : { x: "-100%" }}
        animate={isInView ? { x: "200%" } : {}}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-fcn-accent/8 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <span className="mx-auto mb-3 block h-px w-12 bg-gradient-to-r from-transparent via-fcn-accent to-transparent" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fcn-primary/60 dark:text-fcn-accent/60">
            Our Partners in Care
          </p>
          <h2 className="mt-2 text-sm font-medium text-fcn-text-light/80 dark:text-fcn-text-dark/80 md:text-lg">
            Trusted by leading healthcare institutions across{" "}
            <span className="text-fcn-primary dark:text-fcn-accent">Dire Dawa</span>
          </h2>
        </motion.div>

        {/* Partner icons — mobile: icon strip, desktop: full cards */}
        <motion.div
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Mobile: icon + tiny label in a clean strip */}
          <div className="flex items-center justify-between gap-2 sm:hidden">
            {partners.map((p) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.name}
                  variants={shouldReduceMotion ? undefined : cardVariants}
                  className="group flex flex-1 flex-col items-center gap-1.5"
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110"
                    style={{
                      backgroundColor: `hsla(${p.hue}, 70%, 45%, 0.1)`,
                      color: `hsl(${p.hue}, 70%, 45%)`
                    }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="w-full text-center text-[9px] font-medium leading-tight text-fcn-text-light/60 dark:text-gray-400">
                    {p.name.length > 16 ? p.name.split(" ").slice(0, 2).join(" ") + "…" : p.name}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Desktop/tablet: full cards */}
          <div className="hidden grid-cols-3 gap-3 sm:grid md:grid-cols-5 md:gap-5">
            {partners.map((p) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.name}
                  variants={shouldReduceMotion ? undefined : cardVariants}
                  whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.03, transition: { duration: 0.2 } }}
                  className="group relative"
                >
                  <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/70 p-3 text-center shadow-sm backdrop-blur transition-all duration-300 hover:border-fcn-accent/30 hover:shadow-[0_12px_40px_rgba(10,126,164,0.12)] dark:border-white/5 dark:bg-fcn-dark/60 dark:hover:shadow-[0_12px_40px_rgba(45,212,191,0.08)] sm:px-5 sm:py-5">
                    <div
                      className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ boxShadow: `inset 0 0 30px hsla(${p.hue}, 70%, 50%, 0.05)` }}
                    />
                    <div
                      className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 group-hover:shadow-[0_0_24px_rgba(10,126,164,0.2)] sm:mb-3 sm:h-11 sm:w-11"
                      style={{
                        backgroundColor: `hsla(${p.hue}, 70%, 45%, 0.1)`,
                        color: `hsl(${p.hue}, 70%, 45%)`
                      }}
                    >
                      <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
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
        </motion.div>

        {/* Stats strip */}
        <motion.div
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={shouldReduceMotion ? undefined : statVariants}
                className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/50 px-4 py-3 backdrop-blur dark:bg-white/[0.03]"
              >
                <Icon className="h-4 w-4 shrink-0 text-fcn-accent" />
                <div className="text-left">
                  <p className="text-sm font-bold text-fcn-text-light dark:text-white sm:text-base">{s.value}</p>
                  <p className="text-[10px] text-fcn-text-light/50 dark:text-gray-400 sm:text-xs">{s.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 text-center text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40"
        >
          Serving over 50,000+ patients across the region
        </motion.p>
      </div>
    </section>
  );
};

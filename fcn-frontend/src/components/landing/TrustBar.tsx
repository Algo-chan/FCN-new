import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { MOTION } from "@/styles/motion";
import { LocationMap } from "./LocationMap";

export const TrustBar = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const shouldReduceMotion = useReducedMotion();

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

        {/* Interactive location map — glowing hospital nodes across Dire Dawa */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: MOTION.standard.ease }}
        >
          <LocationMap />
        </motion.div>

      </div>
    </section>
  );
};

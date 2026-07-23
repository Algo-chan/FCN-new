import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Building2, HeartHandshake, Stethoscope, Users } from "lucide-react";
import { useAnimeCounter } from "@/hooks/useAnimeCounter";

interface StatCardProps {
  icon: React.ElementType;
  target: number;
  suffix: string;
  label: string;
  delay: number;
}

const StatCard = ({ icon: Icon, target, suffix, label, delay }: StatCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const shouldReduceMotion = useReducedMotion();
  const count = useAnimeCounter(target, 2000, isInView);

  return (
    <motion.div
      ref={ref}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: shouldReduceMotion ? 0 : delay, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl border border-white/10 bg-white/50 p-4 text-center backdrop-blur-sm transition-all duration-300 hover:border-fcn-accent/30 hover:shadow-[0_12px_40px_rgba(45,212,191,0.1)] dark:bg-white/[0.03] sm:p-6"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ delay: shouldReduceMotion ? 0 : delay + 0.1, type: "spring", stiffness: 200, damping: 15 }}
      >
        <Icon className="mx-auto mb-2 h-6 w-6 text-fcn-accent sm:mb-3 sm:h-7 sm:w-7" />
      </motion.div>
      <p className="text-2xl font-extrabold text-fcn-text-light dark:text-white sm:text-3xl">
        {isInView ? count.toLocaleString() : 0}{suffix}
      </p>
      <p className="mt-1 text-xs text-fcn-text-light/60 dark:text-gray-400 sm:text-sm">{label}</p>
    </motion.div>
  );
};

export const StatsSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const shouldReduceMotion = useReducedMotion();

  const stats = [
    { icon: Users, target: 5000, suffix: "+", label: "Patients Served" },
    { icon: Stethoscope, target: 50, suffix: "+", label: "Partner Doctors" },
    { icon: HeartHandshake, target: 98, suffix: "%", label: "Satisfaction Rate" },
    { icon: Building2, target: 3, suffix: "", label: "Partner Hospitals" }
  ];

  return (
    <section ref={ref} className="bg-fcn-light py-10 px-4 dark:bg-[#111827] sm:py-20 sm:px-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-2xl font-bold text-fcn-text-light dark:text-white sm:text-3xl">FCN by the Numbers</h2>
          <p className="mt-2 text-fcn-text-light/60 dark:text-gray-400">Growing healthcare access across Dire Dawa</p>
        </motion.div>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.label} {...stat} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
};

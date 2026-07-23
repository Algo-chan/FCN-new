import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

const bullets = [
  "Live occupancy dashboard for your front desk team",
  "Reduced non-urgent walk-in volume",
  "Seamless integration with your existing systems"
];

export const ForHospitalsSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section ref={ref} id="for-hospitals" className="scroll-mt-20 py-10 px-4 sm:py-20 sm:px-6">
      <div className="mx-auto max-w-7xl items-center gap-12 px-4 sm:px-6 lg:flex lg:px-8">
        {/* Left - Image */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
          className="relative mb-8 hidden lg:mb-0 lg:block lg:w-1/2"
        >
          <img
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop&auto=format"
            alt="Dire Dawa General Hospital"
            loading="lazy"
            className="w-full rounded-2xl object-cover"
            style={{ aspectRatio: "4/3" }}
          />
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: shouldReduceMotion ? 0 : 0.4 }}
            className="absolute -bottom-4 -right-4 rounded-2xl border border-white/20 bg-white/80 px-4 py-3 backdrop-blur-lg dark:bg-[#0D1117]/80"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-fcn-text-light dark:text-white">
              📊 Real-time occupancy tracking
            </p>
          </motion.div>
        </motion.div>

        {/* Right - Content */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: shouldReduceMotion ? 0 : 0.15, duration: shouldReduceMotion ? 0 : 0.5 }}
          className="lg:w-1/2"
        >
          <p className="mb-2 text-xs font-semibold tracking-widest text-fcn-accent">FOR HOSPITALS</p>
          <h2 className="mb-4 text-xl font-bold text-fcn-text-light dark:text-white sm:text-3xl">Reduce Overcrowding. Improve Patient Flow.</h2>
          <p className="mb-6 text-sm text-fcn-text-light/60 dark:text-gray-400 sm:text-base">
            Partner with FCN to give patients visibility into your real-time capacity, reduce unnecessary walk-ins, and route appropriate cases to remote consultation first.
          </p>
          <ul className="mb-8 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-fcn-text-light/70 dark:text-gray-300">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-fcn-accent" /> {b}
              </li>
            ))}
          </ul>
          <a href="mailto:partnerships@fcn.health">
            <Button>Partner With Us</Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
};
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { CheckCircle } from "lucide-react";
import { ImagePlaceholder } from "@/components/landing/ImagePlaceholder";
import { Button } from "@/components/ui/Button";

const bullets = [
  "Flexible scheduling — work when you want",
  "Complete patient context in every consultation",
  "Transparent earnings, paid reliably"
];

export const ForDoctorsSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section ref={ref} id="for-doctors" className="scroll-mt-20 py-10 px-4 sm:py-20 sm:px-6">
      <div className="mx-auto max-w-7xl items-center gap-12 px-4 sm:px-6 lg:flex lg:flex-row-reverse lg:px-8">
        {/* Right - Image (reversed) */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative mb-8 hidden lg:mb-0 lg:block lg:w-1/2"
        >
          <ImagePlaceholder
            query="Confident Ethiopian female doctor in clinic, white coat, stethoscope, warm professional portrait, soft lighting"
            alt="Ethiopian doctor using FCN"
            aspectRatio="4/3"
            rounded="2xl"
            className="w-full"
          />
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: shouldReduceMotion ? 0 : 0.4, type: "spring", stiffness: 200, damping: 15 }}
            className="absolute -bottom-4 -left-4 rounded-2xl border border-white/20 bg-white/80 px-4 py-3 backdrop-blur-lg dark:bg-[#0D1117]/80"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-fcn-text-light dark:text-white">
              ⭐ 4.9 average rating
            </p>
          </motion.div>
        </motion.div>

        {/* Left - Content */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: shouldReduceMotion ? 0 : 0.15, duration: shouldReduceMotion ? 0 : 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="lg:w-1/2"
        >
          <p className="mb-2 text-xs font-semibold tracking-widest text-fcn-accent">FOR DOCTORS</p>
          <h2 className="mb-4 text-xl font-bold text-fcn-text-light dark:text-white sm:text-3xl">Practice Medicine On Your Terms</h2>
          <p className="mb-6 text-sm text-fcn-text-light/60 dark:text-gray-400 sm:text-base">
            Set your own hours. Consult from anywhere. Build a verified reputation. FCN handles the platform — you focus on patient care.
          </p>
          <ul className="mb-8 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm text-fcn-text-light/70 dark:text-gray-300">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-fcn-accent" /> {b}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row">
            <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.03 }} whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}>
              <Button>Join as a Doctor</Button>
            </motion.div>
            <a href="#faq">
              <motion.div whileHover={shouldReduceMotion ? {} : { scale: 1.03 }} whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}>
                <Button variant="ghost">Learn More</Button>
              </motion.div>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

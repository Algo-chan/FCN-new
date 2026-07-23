import { type PropsWithChildren } from "react";
import { motion, useReducedMotion } from "motion/react";

export const PageTransition = ({ children }: PropsWithChildren) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: "easeOut" }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
};

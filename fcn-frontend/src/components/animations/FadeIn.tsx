import { type PropsWithChildren } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface FadeInProps extends PropsWithChildren {
  delay?: number;
  duration?: number;
}

export const FadeIn = ({ children, delay = 0, duration = 0.3 }: FadeInProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: shouldReduceMotion ? 0 : delay, duration: shouldReduceMotion ? 0 : duration }}
    >
      {children}
    </motion.div>
  );
};

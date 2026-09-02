import { useEffect, type PropsWithChildren } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSound } from "@/hooks/useSound";
import { MOTION } from "@/styles/motion";

export const PageTransition = ({ children }: PropsWithChildren) => {
  const shouldReduceMotion = useReducedMotion();
  const { playTransition } = useSound();

  useEffect(() => {
    playTransition();
  }, [playTransition]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
      transition={{ duration: shouldReduceMotion ? 0 : MOTION.standard.duration, ease: MOTION.standard.ease }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  );
};

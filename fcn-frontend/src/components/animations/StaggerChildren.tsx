import { type PropsWithChildren } from "react";
import { motion, useReducedMotion } from "motion/react";

export const StaggerChildren = ({ children }: PropsWithChildren) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : 0.1
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children }: PropsWithChildren) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0 }
      }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

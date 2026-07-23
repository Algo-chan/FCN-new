import { type PropsWithChildren } from "react";
import { motion, useReducedMotion } from "motion/react";

interface ScrollRevealProps extends PropsWithChildren {
  delay?: number;
  direction?: "up" | "left" | "right";
  className?: string;
}

const directionOffset = {
  up: { y: 40 },
  left: { x: -40 },
  right: { x: 40 }
};

export const ScrollReveal = ({
  children,
  delay = 0,
  direction = "up",
  className
}: ScrollRevealProps) => {
  const shouldReduceMotion = useReducedMotion();
  const offset = directionOffset[direction];

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        delay: shouldReduceMotion ? 0 : delay,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

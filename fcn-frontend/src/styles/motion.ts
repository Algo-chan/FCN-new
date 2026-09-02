export const MOTION = {
  fast: { duration: 0.16, ease: [0.32, 0.72, 0, 1] as const },
  standard: { duration: 0.28, ease: [0.32, 0.72, 0, 1] as const },
  spring: { type: "spring" as const, stiffness: 260, damping: 26, mass: 1 },
  accordion: { duration: 0.24, ease: [0.32, 0.72, 0, 1] as const }
} as const;

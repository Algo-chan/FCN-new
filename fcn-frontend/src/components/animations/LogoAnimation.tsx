import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { animate } from "animejs";

interface LogoAnimationProps {
  onComplete?: () => void;
  size?: number;
}

export const LogoAnimation = ({ onComplete, size = 80 }: LogoAnimationProps) => {
  const shouldReduceMotion = useReducedMotion();
  const heartbeatRef = useRef<SVGPathElement>(null);
  const crossHRef = useRef<SVGLineElement>(null);
  const crossVRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete?.();
      return;
    }

    // Stroke draw the medical cross
    if (crossHRef.current) {
      const hLen = crossHRef.current.getTotalLength();
      crossHRef.current.style.strokeDasharray = String(hLen);
      crossHRef.current.style.strokeDashoffset = String(hLen);
      animate(crossHRef.current, {
        strokeDashoffset: [hLen, 0],
        duration: 600,
        easing: "easeOutCubic"
      });
    }

    if (crossVRef.current) {
      const vLen = crossVRef.current.getTotalLength();
      crossVRef.current.style.strokeDasharray = String(vLen);
      crossVRef.current.style.strokeDashoffset = String(vLen);
      animate(crossVRef.current, {
        strokeDashoffset: [vLen, 0],
        duration: 600,
        easing: "easeOutCubic",
        delay: 200
      });
    }

    // Heartbeat line after cross
    if (heartbeatRef.current) {
      const hLen = heartbeatRef.current.getTotalLength();
      heartbeatRef.current.style.strokeDasharray = String(hLen);
      heartbeatRef.current.style.strokeDashoffset = String(hLen);
      animate(heartbeatRef.current, {
        strokeDashoffset: [hLen, 0],
        duration: 800,
        easing: "easeInOut",
        delay: 600,
        onComplete: () => onComplete?.()
      });
    }
  }, [shouldReduceMotion, onComplete]);

  if (shouldReduceMotion) {
    return (
      <img
        src="/logo/fcn-logo-full.png"
        alt="FCN"
        className="h-12 w-auto"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative flex flex-col items-center"
    >
      {/* SVG Logo with stroke reveal */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        className="mb-3"
      >
        {/* Circle border */}
        <circle
          cx="40"
          cy="40"
          r="36"
          stroke="#2DD4BF"
          strokeWidth="2"
          fill="none"
          opacity="0.3"
        />

        {/* Medical cross — horizontal */}
        <line
          ref={crossHRef}
          x1="22"
          y1="40"
          x2="58"
          y2="40"
          stroke="#2DD4BF"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Medical cross — vertical */}
        <line
          ref={crossVRef}
          x1="40"
          y1="22"
          x2="40"
          y2="58"
          stroke="#2DD4BF"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Heartbeat line below cross */}
        <path
          ref={heartbeatRef}
          d="M10,55 L25,55 L30,55 L35,48 L40,62 L45,50 L50,58 L55,55 L70,55"
          fill="none"
          stroke="#0A7EA4"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>

      {/* Logo text */}
      <motion.img
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        src="/logo/fcn-logo-full.png"
        alt="FCN"
        className="h-10 w-auto"
      />
    </motion.div>
  );
};

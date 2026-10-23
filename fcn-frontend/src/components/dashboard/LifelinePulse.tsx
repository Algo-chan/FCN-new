import React from "react";
import { useReducedMotion } from "framer-motion";
import { clsx } from "clsx";

interface LifelinePulseProps {
  className?: string;
}

export const LifelinePulse: React.FC<LifelinePulseProps> = ({ className }) => {
  const shouldReduceMotion = useReducedMotion();

  // Full-width clinical ECG Heartbeat rhythm spanning exactly from x=0 to x=600 (viewBox 0 0 600 36)
  // Perfectly spaced 3-beat rhythm with authentic P-wave, Q-dip, tall R-spike, deep S-dip, and T-recovery
  const pathD =
    "M 0 18 L 50 18 C 58 18, 62 13, 67 13 C 72 13, 76 18, 84 18 L 92 18 L 96 22 L 106 3 L 116 33 L 124 18 L 132 18 C 140 18, 144 11, 150 11 C 156 11, 160 18, 168 18 L 250 18 C 258 18, 262 13, 267 13 C 272 13, 276 18, 284 18 L 292 18 L 296 22 L 306 3 L 316 33 L 324 18 L 332 18 C 340 18, 344 11, 350 11 C 356 11, 360 18, 368 18 L 450 18 C 458 18, 462 13, 467 13 C 472 13, 476 18, 484 18 L 492 18 L 496 22 L 506 3 L 516 33 L 524 18 L 532 18 C 540 18, 544 11, 550 11 C 556 11, 560 18, 568 18 L 600 18";

  return (
    <div
      className={clsx(
        "relative w-full h-8 overflow-hidden select-none pointer-events-none",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 600 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full block"
      >
        <defs>
          {/* Subtle baseline track spanning left to right border */}
          <linearGradient id="lifeline-base-fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="15%" stopColor="#2DD4BF" stopOpacity="0.25" />
            <stop offset="85%" stopColor="#2DD4BF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
          </linearGradient>

          {/* Active pulse glow gradient */}
          <linearGradient id="lifeline-pulse-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.3" />
            <stop offset="40%" stopColor="#5EEAD4" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.8" />
          </linearGradient>

          {/* Smooth edge fade mask for both left entrance and right exit */}
          <mask id="lifeline-edge-fade-mask" maskUnits="userSpaceOnUse">
            <linearGradient id="lifeline-edge-grad" x1="0" y1="0" x2="600" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="25" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="575" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="600" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <rect x="0" y="0" width="600" height="36" fill="url(#lifeline-edge-grad)" />
          </mask>

          {/* Neon Glow Filter */}
          <filter id="lifeline-glow-filter" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Underlying baseline track touching both left and right edges */}
        <path
          d={pathD}
          pathLength={1000}
          stroke="url(#lifeline-base-fade)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 2. Animated Life Line Surge entering from left border and exiting to right border */}
        {!shouldReduceMotion ? (
          <g mask="url(#lifeline-edge-fade-mask)">
            {/* Ambient Glow Trail */}
            <path
              d={pathD}
              pathLength={1000}
              stroke="url(#lifeline-pulse-glow)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#lifeline-glow-filter)"
              className="animate-lifeline-pulse opacity-75"
              style={{ strokeDasharray: "200 1000" }}
            />
            {/* Crisp Core Beam */}
            <path
              d={pathD}
              pathLength={1000}
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-lifeline-pulse"
              style={{ strokeDasharray: "200 1000" }}
            />
          </g>
        ) : null}
      </svg>

      <style>{`
        @keyframes lifelineSweep {
          0% {
            stroke-dashoffset: 200;
            opacity: 0;
          }
          3% {
            opacity: 1;
          }
          97% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -1000;
            opacity: 0;
          }
        }

        .animate-lifeline-pulse {
          animation: lifelineSweep 4.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

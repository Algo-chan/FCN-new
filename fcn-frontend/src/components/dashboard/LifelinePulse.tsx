import React from "react";
import { useReducedMotion } from "framer-motion";
import { clsx } from "clsx";

interface LifelinePulseProps {
  className?: string;
}

export const LifelinePulse: React.FC<LifelinePulseProps> = ({ className }) => {
  const shouldReduceMotion = useReducedMotion();

  // ECG Heartbeat path coordinates (viewBox 0 0 500 36)
  // Starts flat, gives gentle P-wave, sharp high QRS spike, recovery T-wave, second pulse, and flattens out
  const pathD =
    "M 0 18 L 80 18 C 85 18, 88 14, 91 14 C 94 14, 97 18, 102 18 L 112 18 L 116 21 L 123 3 L 131 32 L 138 18 L 145 18 C 150 18, 153 12, 158 12 C 163 12, 166 18, 172 18 L 260 18 C 265 18, 268 14, 271 14 C 274 14, 277 18, 282 18 L 292 18 L 296 21 L 303 4 L 311 31 L 318 18 L 325 18 C 330 18, 333 13, 338 13 C 343 13, 346 18, 352 18 L 500 18";

  return (
    <div
      className={clsx(
        "relative w-full h-8 overflow-hidden select-none pointer-events-none",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 500 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          {/* Base track gradient: subtle white that diminishes to 0 on the right */}
          <linearGradient id="lifeline-base-fade" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="35%" stopColor="#2DD4BF" stopOpacity="0.2" />
            <stop offset="70%" stopColor="#2DD4BF" stopOpacity="0.08" />
            <stop offset="95%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Active pulse glow gradient: bright neon cyan/emerald */}
          <linearGradient id="lifeline-pulse-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.2" />
            <stop offset="40%" stopColor="#5EEAD4" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.8" />
          </linearGradient>

          {/* Fade mask that diminishes and completely dissolves the pulse into the right side */}
          <mask id="lifeline-right-fade-mask" maskUnits="userSpaceOnUse">
            <linearGradient id="lifeline-mask-grad" x1="0" y1="0" x2="500" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="82%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
            <rect x="0" y="0" width="500" height="36" fill="url(#lifeline-mask-grad)" />
          </mask>

          {/* Neon Glow Filter */}
          <filter id="lifeline-glow-filter" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Underlying baseline track */}
        <path
          d={pathD}
          stroke="url(#lifeline-base-fade)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 2. Animated Life Line Surge coming from left and vanishing on right */}
        {!shouldReduceMotion ? (
          <g mask="url(#lifeline-right-fade-mask)">
            {/* Soft Ambient Glow Layer */}
            <path
              d={pathD}
              stroke="url(#lifeline-pulse-glow)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#lifeline-glow-filter)"
              className="animate-lifeline-pulse opacity-70"
            />
            {/* Crisp High-Energy Core Beam */}
            <path
              d={pathD}
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-lifeline-pulse"
            />
          </g>
        ) : null}
      </svg>

      <style>{`
        @keyframes lifelineSweep {
          0% {
            stroke-dasharray: 120 500;
            stroke-dashoffset: 620;
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          75% {
            opacity: 0.9;
          }
          95% {
            opacity: 0;
          }
          100% {
            stroke-dasharray: 120 500;
            stroke-dashoffset: -520;
            opacity: 0;
          }
        }

        .animate-lifeline-pulse {
          animation: lifelineSweep 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

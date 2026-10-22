import { motion } from "framer-motion";

export const StethoscopeAnimation = () => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer breathing aura */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.15, 0.4, 0.15]
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute h-44 w-44 rounded-full bg-teal-400 blur-2xl pointer-events-none"
      />

      {/* Middle pulsing ring */}
      <motion.div
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.3, 0.7, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute h-36 w-36 rounded-full border border-teal-300/40 bg-teal-500/10 pointer-events-none"
      />

      {/* Center Breathing Icon Container */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500/30 via-teal-400/20 to-sky-500/20 p-5 shadow-[0_0_40px_rgba(45,212,191,0.35)] backdrop-blur-xl border border-teal-300/30"
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-teal-300 filter drop-shadow-[0_2px_10px_rgba(45,212,191,0.5)]"
        >
          {/* Eartips */}
          <circle cx="20" cy="12" r="3" fill="currentColor" />
          <circle cx="44" cy="12" r="3" fill="currentColor" />

          {/* Binaural headset tubes */}
          <path
            d="M20 15V22C20 30 26 36 32 38C38 36 44 30 44 22V15"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Single stem tube leading down */}
          <path
            d="M32 38V44C32 50 36 54 42 54C47 54 50 50 50 45C50 39 46 36 40 36"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Chestpiece base & Diaphragm */}
          <circle cx="40" cy="36" r="6" stroke="currentColor" strokeWidth="3" />
          <circle cx="40" cy="36" r="2.5" fill="#5eead4" />

          {/* Pulse wave inside */}
          <path
            d="M25 24H28L30 21L33 27L35 24H39"
            stroke="#99f6e4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
      </motion.div>
    </div>
  );
};

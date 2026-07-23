import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fcn: {
          primary: "#0A7EA4",
          accent: "#2DD4BF",
          dark: "#0D1117",
          light: "#F8FFFE",
          danger: "#F87171",
          warning: "#FBBF24",
          success: "#10B981",
          text: {
            dark: "#E2E8F0",
            light: "#1E293B"
          }
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(10, 126, 164, 0)" },
          "50%": { boxShadow: "0 0 24px rgba(45, 212, 191, 0.45)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" }
        }
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "slide-up": "slide-up 0.35s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
        shimmer: "shimmer 1.2s ease-out"
      }
    }
  },
  plugins: []
};

export default config;

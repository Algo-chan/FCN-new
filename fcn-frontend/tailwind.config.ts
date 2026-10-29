import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fcn: {
          primary: {
            DEFAULT: "#0A7EA4",
            hover: "#086A8A",
            light: "#2DD4BF",
            dark: "#086A8A",
            legacy: "#0A7EA4",
          },
          secondary: {
            DEFAULT: "#FFFFFF",
            hover: "#F8FFFE",
            light: "#FFFFFF",
          },
          accent: "#2DD4BF",
          navy: "#0D1B3E",
          dark: "#0D1117",
          light: "#F8FFFE",
          surface: {
            light: "#FFFFFF",
            dark: "#161B22",
            subtleLight: "#F8FFFE",
            subtleDark: "#1F242C",
          },
          danger: {
            DEFAULT: "#F87171",
            light: "#FB7185",
            legacy: "#F87171",
          },
          warning: {
            DEFAULT: "#FBBF24",
            light: "#FCD34D",
          },
          success: {
            DEFAULT: "#10B981",
            light: "#34D399",
          },
          info: {
            DEFAULT: "#0A7EA4",
            light: "#38BDF8",
          },
          text: {
            dark: "#E2E8F0",
            light: "#1E293B",
            mutedLight: "#64748B",
            mutedDark: "#94A3B8",
          },

          role: {
            patient: "#0A7EA4",
            doctor: "#0284C7",
            nurse: "#E11D48",
            rural: "#D97706",
            hospital: "#4F46E5",
            pharmacy: "#059669",
            admin: "#7C3AED",
          },
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Plus Jakarta Sans",
          "Noto Sans Ethiopic",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        ethiopic: ["Noto Sans Ethiopic", "sans-serif"],
      },
      borderRadius: {
        "card-mobile": "24px",
        "card-desktop": "18px",
        sheet: "28px",
        button: "14px",
      },
      backgroundImage: {
        "gradient-teal-emerald": "linear-gradient(135deg, #0A7EA4 0%, #10B981 100%)",
        "gradient-cyan-sky": "linear-gradient(135deg, #0A7EA4 0%, #2DD4BF 100%)",
        "gradient-amber-orange": "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
        "gradient-rose-coral": "linear-gradient(135deg, #E11D48 0%, #FB7185 100%)",
        "gradient-violet-indigo": "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
        "gradient-dark-card": "linear-gradient(180deg, #161B22 0%, #0D1117 100%)",
        "gradient-primary-action": "linear-gradient(135deg, #0A7EA4 0%, #2DD4BF 100%)",
      },
      boxShadow: {
        "glow-teal": "0 0 24px -2px rgba(45, 212, 191, 0.35)",
        "glow-sky": "0 0 24px -2px rgba(10, 126, 164, 0.35)",
        "sticky-action": "0 -8px 24px rgba(15, 23, 42, 0.08)",
        "card-soft": "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
        "card-soft-dark": "0 4px 24px -2px rgba(0, 0, 0, 0.45)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(10, 126, 164, 0)" },
          "50%": { boxShadow: "0 0 24px rgba(45, 212, 191, 0.45)" },
        },
        "pulse-border": {
          "0%, 100%": { borderColor: "rgba(45, 212, 191, 0.35)" },
          "50%": { borderColor: "rgba(45, 212, 191, 0.9)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down-sheet": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-border": "pulse-border 2.5s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-down-sheet": "slide-down-sheet 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;

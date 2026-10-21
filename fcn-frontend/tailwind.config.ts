import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fcn: {
          // Existing base colors (preserved for full compatibility)
          primary: {
            DEFAULT: "#0D9488", // Fresh healing teal
            hover: "#0F766E",
            light: "#14B8A6",
            dark: "#0F766E",
            legacy: "#0A7EA4",
          },
          secondary: {
            DEFAULT: "#0284C7", // Clinical sky blue
            hover: "#0369A1",
            light: "#38BDF8",
          },
          accent: "#2DD4BF",
          dark: "#0B0F15", // Deep midnight slate canvas
          light: "#F8FAF9", // Crisp clinical canvas (never sterile white)
          surface: {
            light: "#FFFFFF",
            dark: "#131B24",
            subtleLight: "#F1F5F4",
            subtleDark: "#1A2430",
          },
          danger: {
            DEFAULT: "#E11D48", // Rose 600
            light: "#FB7185",
            legacy: "#F87171",
          },
          warning: {
            DEFAULT: "#D97706", // Amber 600
            light: "#FBBF24",
          },
          success: {
            DEFAULT: "#059669", // Emerald 600
            light: "#10B981",
          },
          info: {
            DEFAULT: "#6366F1", // Indigo / AI insights
            light: "#818CF8",
          },
          text: {
            dark: "#F8FAFC",
            light: "#0F172A",
            mutedLight: "#64748B",
            mutedDark: "#94A3B8",
          },

          // Role signatures for distinct dashboard context
          role: {
            patient: "#0D9488",
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
          "Plus Jakarta Sans",
          "Noto Sans Ethiopic",
          "Inter",
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
        "gradient-teal-emerald": "linear-gradient(135deg, #0D9488 0%, #10B981 100%)",
        "gradient-cyan-sky": "linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)",
        "gradient-amber-orange": "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
        "gradient-rose-coral": "linear-gradient(135deg, #E11D48 0%, #FB7185 100%)",
        "gradient-violet-indigo": "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
        "gradient-dark-card": "linear-gradient(180deg, #18222E 0%, #111822 100%)",
        "gradient-primary-action": "linear-gradient(135deg, #0D9488 0%, #0284C7 100%)",
      },
      boxShadow: {
        "glow-teal": "0 0 24px -2px rgba(13, 148, 136, 0.35)",
        "glow-sky": "0 0 24px -2px rgba(2, 132, 199, 0.35)",
        "sticky-action": "0 -8px 24px rgba(15, 23, 42, 0.08)",
        "card-soft": "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
        "card-soft-dark": "0 4px 24px -2px rgba(0, 0, 0, 0.45)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(13, 148, 136, 0)" },
          "50%": { boxShadow: "0 0 24px rgba(20, 184, 166, 0.45)" },
        },
        "pulse-border": {
          "0%, 100%": { borderColor: "rgba(20, 184, 166, 0.35)" },
          "50%": { borderColor: "rgba(20, 184, 166, 0.9)" },
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

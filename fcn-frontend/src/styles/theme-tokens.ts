/**
 * Fast Care Now (FCN) Theme Tokens
 *
 * Defines the design system foundation for both Light & Dark modes,
 * including clinical health colors, energetic mobile fitness-inspired gradients,
 * role signatures, and responsive typography scales.
 */

export const THEME_TOKENS = {
  colors: {
    // Canvas & Surface
    canvas: {
      light: "#F8FAF9",
      dark: "#0B0F15",
    },
    surface: {
      light: "#FFFFFF",
      dark: "#131B24",
      lightBorder: "rgba(15, 23, 42, 0.08)",
      darkBorder: "rgba(255, 255, 255, 0.08)",
    },
    surfaceSubtle: {
      light: "#F1F5F4",
      dark: "#1A2430",
    },

    // Brand & Clinical Palette
    primary: {
      light: "#0D9488", // Teal 600 - trustworthy, healing
      lightHover: "#0F766E",
      dark: "#14B8A6", // Teal 500 - vibrant, luminous
      darkHover: "#2DD4BF",
    },
    secondary: {
      light: "#0284C7", // Sky 600 - clinical calm
      dark: "#38BDF8", // Sky 400
    },

    // Semantics & Urgency
    success: {
      light: "#059669",
      dark: "#10B981",
      bgLight: "rgba(16, 185, 129, 0.1)",
      bgDark: "rgba(16, 185, 129, 0.15)",
    },
    warning: {
      light: "#D97706",
      dark: "#FBBF24",
      bgLight: "rgba(245, 158, 11, 0.1)",
      bgDark: "rgba(245, 158, 11, 0.15)",
    },
    critical: {
      light: "#E11D48", // Rose 600 - emergency / hypoxemia
      dark: "#FB7185",
      bgLight: "rgba(225, 29, 72, 0.1)",
      bgDark: "rgba(225, 29, 72, 0.15)",
    },
    info: {
      light: "#6366F1", // Indigo 500 - AI / triage
      dark: "#818CF8",
      bgLight: "rgba(99, 102, 241, 0.1)",
      bgDark: "rgba(99, 102, 241, 0.15)",
    },

    // Text & Contrast
    text: {
      lightPrimary: "#0F172A", // Slate 900
      lightSecondary: "#475569", // Slate 600
      lightMuted: "#94A3B8", // Slate 400
      darkPrimary: "#F8FAFC", // Slate 50
      darkSecondary: "#94A3B8", // Slate 400
      darkMuted: "#64748B", // Slate 500
    },

    // Role-specific signatures
    roleAccents: {
      patient: {
        badge: "#0D9488",
        bg: "rgba(13, 148, 136, 0.1)",
        label: "Patient",
      },
      doctor: {
        badge: "#0284C7",
        bg: "rgba(2, 132, 199, 0.1)",
        label: "Doctor",
      },
      nurse: {
        badge: "#E11D48",
        bg: "rgba(225, 29, 72, 0.1)",
        label: "Nurse / Field Officer",
      },
      rural_health_officer: {
        badge: "#D97706",
        bg: "rgba(217, 119, 6, 0.1)",
        label: "Rural Health Officer",
      },
      hospital_admin: {
        badge: "#4F46E5",
        bg: "rgba(79, 70, 229, 0.1)",
        label: "Hospital Admin",
      },
      pharmacy_admin: {
        badge: "#059669",
        bg: "rgba(5, 150, 105, 0.1)",
        label: "Pharmacy Admin",
      },
      super_admin: {
        badge: "#7C3AED",
        bg: "rgba(124, 58, 237, 0.1)",
        label: "Super Admin",
      },
    },
  },

  // Mobile Fitness-Inspired Gradients (bold, motivating cards)
  gradients: {
    tealEmerald: "linear-gradient(135deg, #0D9488 0%, #10B981 100%)",
    cyanSky: "linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)",
    amberOrange: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    roseCoral: "linear-gradient(135deg, #E11D48 0%, #FB7185 100%)",
    violetIndigo: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
    darkCard: "linear-gradient(180deg, #18222E 0%, #111822 100%)",
    primaryButton: "linear-gradient(135deg, #0D9488 0%, #0284C7 100%)",
  },

  // Shape, Radius & Depths
  radius: {
    pill: "9999px",
    cardMobile: "24px",
    cardDesktop: "18px",
    button: "14px",
    input: "12px",
    sheet: "28px",
  },

  // Touch & Layout Constants
  touch: {
    minHeightMobile: "48px",
    actionButtonHeight: "54px",
  },
} as const;

export type ThemeTokens = typeof THEME_TOKENS;

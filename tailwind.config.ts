import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./server/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          primary: "#0A0A0A",
          secondary: "#5C5C5C",
          tertiary: "#9A9A9A",
        },
        paper: "#FAFAF7",
        surface: "#FFFFFF",
        elevated: "#F5F3EF",
        dusk: "#1B3A4B",
        seaglass: "#D4E4E8",
        sage: "#8FA896",
        sand: "#E8DFD0",
        coral: "#E87B5F",
        hairline: "#ECEAE4",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 2px 20px rgba(10,10,10,0.04)",
        sheet: "0 -6px 32px rgba(10,10,10,0.08)",
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
      transitionTimingFunction: {
        ios: "cubic-bezier(0.32, 0.72, 0.24, 1.0)",
      },
      keyframes: {
        "draw-lemniscate": {
          "0%": { strokeDashoffset: "400" },
          "100%": { strokeDashoffset: "0" },
        },
        "sheet-in": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "draw-lemniscate": "draw-lemniscate 1.2s cubic-bezier(0.32, 0.72, 0.24, 1.0) infinite",
        "sheet-in": "sheet-in 320ms cubic-bezier(0.32, 0.72, 0.24, 1.0)",
        "fade-in": "fade-in 240ms cubic-bezier(0.32, 0.72, 0.24, 1.0)",
      },
    },
  },
  plugins: [animate],
};

export default config;

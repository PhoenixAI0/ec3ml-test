import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#08080c",
          50: "#0e0e14",
          100: "#12121a",
          200: "#1a1a26",
          300: "#24243a",
          400: "#2e2e44",
        },
        surface: "#12121a",
        border: "#1e1e2e",
        accent: {
          DEFAULT: "#00e5a0",
          dim: "#00b37d",
          glow: "rgba(0, 229, 160, 0.15)",
        },
        warm: {
          DEFAULT: "#ff6b4a",
          dim: "#cc5538",
          glow: "rgba(255, 107, 74, 0.15)",
        },
        text: {
          primary: "#e8e8ed",
          secondary: "#6b6b7b",
          muted: "#44445a",
        },
      },
      fontFamily: {
        display: ["Syne", "system-ui", "sans-serif"],
        body: ["Outfit", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      fontSize: {
        // Projector-friendly sizes
        "proj-sm": ["1.125rem", { lineHeight: "1.6" }],
        "proj-base": ["1.375rem", { lineHeight: "1.5" }],
        "proj-lg": ["1.75rem", { lineHeight: "1.4" }],
        "proj-xl": ["2.25rem", { lineHeight: "1.3" }],
        "proj-2xl": ["3rem", { lineHeight: "1.2" }],
        "proj-3xl": ["4rem", { lineHeight: "1.1" }],
        "proj-hero": ["5.5rem", { lineHeight: "1.0" }],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "scan": "scan 3s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

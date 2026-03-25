import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#07070f",
          50: "#0c0c18",
          100: "#10101f",
          200: "#181830",
          300: "#222244",
          400: "#2c2c55",
        },
        surface: "#10101f",
        border: "#1e1e3a",
        accent: {
          DEFAULT: "#a78bfa",
          dim: "#8b6fe0",
          glow: "rgba(167, 139, 250, 0.15)",
        },
        warm: {
          DEFAULT: "#fb923c",
          dim: "#e87c2a",
          glow: "rgba(251, 146, 60, 0.15)",
        },
        teal: {
          DEFAULT: "#2dd4bf",
          dim: "#20b2a0",
          glow: "rgba(45, 212, 191, 0.15)",
        },
        text: {
          primary: "#f0f0f5",
          secondary: "#8888a8",
          muted: "#4a4a6a",
        },
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "system-ui", "sans-serif"],
        body: ["Lexend", "system-ui", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      fontSize: {
        "proj-sm": ["1.125rem", { lineHeight: "1.6" }],
        "proj-base": ["1.375rem", { lineHeight: "1.5" }],
        "proj-lg": ["1.75rem", { lineHeight: "1.4" }],
        "proj-xl": ["2.25rem", { lineHeight: "1.3" }],
        "proj-2xl": ["3rem", { lineHeight: "1.2" }],
        "proj-3xl": ["4rem", { lineHeight: "1.1" }],
        "proj-hero": ["6rem", { lineHeight: "0.95" }],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        scan: "scan 3s linear infinite",
        "mesh-drift": "meshDrift 20s ease-in-out infinite",
        shimmer: "shimmer 3s ease-in-out infinite",
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
        meshDrift: {
          "0%, 100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(3%, -2%) rotate(1deg)" },
          "66%": { transform: "translate(-2%, 3%) rotate(-1deg)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

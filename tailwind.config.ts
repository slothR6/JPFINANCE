import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
      },
      boxShadow: {
        soft: "0 18px 50px -22px rgba(15, 23, 42, 0.25)",
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 35%), radial-gradient(circle at top right, rgba(245, 158, 11, 0.15), transparent 30%), linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.98) 100%)",
        "mesh-dark":
          "radial-gradient(circle at top left, rgba(45, 212, 191, 0.16), transparent 35%), radial-gradient(circle at top right, rgba(251, 191, 36, 0.12), transparent 30%), linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(2,6,23,0.98) 100%)",
      },
      fontFamily: {
        display: ["var(--font-manrope)"],
        body: ["var(--font-ibm-plex-sans)"],
      },
    },
  },
  plugins: [forms],
};

export default config;


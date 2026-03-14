/**
 * Heritage Design System v2.1 — Tailwind CSS Extension
 * Blaze Sports Intel | March 14, 2026
 *
 * Usage: Import and spread into your tailwind.config.ts
 *
 * import { heritageThemeExtension } from './heritage-tailwind-extension';
 * export default { ...heritageThemeExtension, content: [...] };
 */

import type { Config } from "tailwindcss";

export const heritageThemeExtension: Partial<Config> = {
  theme: {
    extend: {
      /* ======================== */
      /* COLORS                  */
      /* ======================== */
      colors: {
        bsi: {
          // Surfaces
          scoreboard: "#0A0A0A",
          pressbox: "#111111",
          dugout: "#161616",

          // Brand (invariant)
          primary: "#BF5700",
          bone: "#F5F2EB",
          dust: "#C4B8A5",
          ember: "#FF6B35",
        },
        heritage: {
          // Accents (data/atmosphere only)
          "columbia-blue": "#4B9CD3",
          "oiler-red": "#C41E3A",
          teal: "#00B2A9",
          bronze: "#8C6239",
          cream: "#F0E6D3",
        },
        border: {
          vintage: "rgba(140, 98, 57, 0.3)",
          subtle: "rgba(245, 242, 235, 0.06)",
          data: "rgba(75, 156, 211, 0.2)",
        },
      },

      /* ======================== */
      /* TYPOGRAPHY               */
      /* ======================== */
      fontFamily: {
        hero: ['"Bebas Neue"', "sans-serif"],
        heading: ["Oswald", "sans-serif"],
        body: ['"Cormorant Garamond"', "serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      fontSize: {
        "display-xl": ["4rem", { lineHeight: "1.1" }],
        display: ["3rem", { lineHeight: "1.1" }],
        h1: ["2rem", { lineHeight: "1.2" }],
        h2: ["1.5rem", { lineHeight: "1.2" }],
        h3: ["1.25rem", { lineHeight: "1.2" }],
        "body-sm": ["0.875rem", { lineHeight: "1.7" }],
        data: ["0.875rem", { lineHeight: "1.4" }],
        "data-sm": ["0.75rem", { lineHeight: "1.4" }],
        label: ["0.6875rem", { lineHeight: "1.2" }],
      },
      lineHeight: {
        tight: "1.1",
        heading: "1.2",
        data: "1.4",
        body: "1.7",
      },
      letterSpacing: {
        heading: "0.15em",
        stamp: "0.08em",
        wide: "0.2em",
      },

      /* ======================== */
      /* SPACING                  */
      /* ======================== */
      spacing: {
        "space-1": "4px",
        "space-2": "8px",
        "space-3": "12px",
        "space-4": "16px",
        "space-5": "20px",
        "space-6": "24px",
        "space-8": "32px",
        "space-10": "40px",
        "space-12": "48px",
        "space-16": "64px",
        "space-20": "80px",
      },

      /* ======================== */
      /* BORDER RADIUS            */
      /* 2px max for standard UI  */
      /* ======================== */
      borderRadius: {
        heritage: "2px",
        // Tailwind's 'full' (9999px) covers badges/pills
      },

      /* ======================== */
      /* SHADOWS / ELEVATION      */
      /* ======================== */
      boxShadow: {
        "heritage-sm": "0 2px 4px rgba(0, 0, 0, 0.2)",
        heritage: "0 8px 16px rgba(0, 0, 0, 0.25)",
        "heritage-lg": "0 18px 40px rgba(0, 0, 0, 0.35)",
        "glow-primary": "0 0 20px rgba(191, 87, 0, 0.15)",
        "glow-data": "0 0 12px rgba(75, 156, 211, 0.1)",
      },

      /* ======================== */
      /* TRANSITIONS / MOTION     */
      /* ======================== */
      transitionDuration: {
        fast: "120ms",
        normal: "200ms",
        slow: "350ms",
        orchestrated: "600ms",
      },
      transitionTimingFunction: {
        "heritage-out": "cubic-bezier(0.0, 0.0, 0.2, 1)",
        "heritage-in-out": "cubic-bezier(0.4, 0.0, 0.2, 1)",
        "heritage-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      /* ======================== */
      /* Z-INDEX                  */
      /* ======================== */
      zIndex: {
        card: "10",
        dropdown: "100",
        sticky: "200",
        modal: "300",
        toast: "400",
        overlay: "500",
      },

      /* ======================== */
      /* CONTAINERS               */
      /* ======================== */
      maxWidth: {
        "container-sm": "640px",
        "container-md": "768px",
        "container-lg": "1024px",
        "container-xl": "1280px",
        "container-max": "1440px",
      },

      /* ======================== */
      /* BREAKPOINTS              */
      /* ======================== */
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },
  },
};

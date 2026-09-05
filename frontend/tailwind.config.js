/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Clinical blue — the single accent color for primary actions, focus, and system highlights.
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#172554",
        },
        // Deep obsidian navy shell — authoritative, calm, institutional.
        navy: {
          950: "#060a12",
          900: "#0a101d",
          850: "#0e172a",
          800: "#131f38",
          750: "#192847",
          700: "#1e3156",
          600: "#2a4273",
          500: "#3d5c99",
          400: "#6080be",
          300: "#91a8da",
          200: "#c5d3ef",
          100: "#e6ecf8",
        },
        // Clinical risk taxonomy — distinct, balanced, and accessible.
        risk: {
          low: "#047857",
          "low-bg": "#ecfdf5",
          "low-border": "#a7f3d0",
          medium: "#b45309",
          "medium-bg": "#fffbeb",
          "medium-border": "#fde68a",
          high: "#c2410c",
          "high-bg": "#fff7ed",
          "high-border": "#fed7aa",
          critical: "#991b1b",
          "critical-bg": "#fef2f2",
          "critical-border": "#fecaca",
        },
        surface: {
          DEFAULT: "#ffffff",
          canvas: "#f8fafc",
          subtle: "#f1f5f9",
          muted: "#e2e8f0",
          inset: "#f8fafc",
        },
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.03em" }],
        "3xs": ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.04em" }],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
        popover: "0 20px 25px -5px rgba(8, 13, 26, 0.25), 0 8px 10px -6px rgba(8, 13, 26, 0.15)",
        panel: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 1px 0 rgba(15, 23, 42, 0.03)",
        drawer: "-4px 0 28px 0 rgba(8, 13, 26, 0.16)",
      },
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "0.75rem",
        xl: "1rem",
      },
    },
  },
  plugins: [],
};

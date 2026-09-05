/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Deep, trustworthy blue — the single accent color for actions and focus.
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#4f8ef7",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#172554",
        },
        // Deep ink/navy — the application shell (sidebar, dark surfaces).
        navy: {
          950: "#080d1a",
          900: "#0d1526",
          850: "#111c33",
          800: "#16213b",
          700: "#1f2c4a",
          600: "#2c3c5e",
          500: "#425474",
          400: "#6a7a9c",
          300: "#95a3c2",
          200: "#c2cbe0",
          100: "#e4e9f5",
        },
        risk: {
          low: "#15803d",
          medium: "#b45309",
          high: "#c2410c",
          critical: "#b91c1c",
        },
        surface: {
          DEFAULT: "#ffffff",
          canvas: "#f5f6fa",
          subtle: "#f5f6fa",
          muted: "#eef0f6",
        },
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.03), 0 1px 1px 0 rgba(15, 23, 42, 0.04)",
        popover: "0 16px 40px -12px rgba(8, 13, 26, 0.28)",
        panel: "0 1px 3px 0 rgba(15, 23, 42, 0.06)",
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};

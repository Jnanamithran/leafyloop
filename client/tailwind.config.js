// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sage:     { DEFAULT: "#2D5A27", 50: "#f0fdf4", 100: "#dcfce7", 500: "#2D5A27", 700: "#1B3022" },
        forest:   { DEFAULT: "#1B3022", light: "#2D5A27" },
        leafy:    { white: "#F9FBF9", charcoal: "#333333" },
      },
      fontFamily: {
        serif:  ["'Playfair Display'", "Georgia", "serif"],
        sans:   ["'DM Sans'", "system-ui", "sans-serif"],
        mono:   ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        "earthy": "0 4px 24px rgba(27, 48, 34, 0.12)",
        "float":  "0 12px 40px rgba(27, 48, 34, 0.16)",
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

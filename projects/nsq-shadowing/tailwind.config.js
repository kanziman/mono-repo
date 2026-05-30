const sharedConfig = require("../../design-system/tailwind.config.ts").default;

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [sharedConfig],
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../design-system/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-pretendard)", "Pretendard", "sans-serif"],
      },
    },
  },
  plugins: [],
};

import sharedConfig from "../../design-system/tailwind.config.ts";

/** @type {import('tailwindcss').Config} */
const config = {
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

export default config;

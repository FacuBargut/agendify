import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D6E6E",
          light: "#E6F4F4",
        },
        accent: "#2D3748",
        background: "#FFFFFF",
        surface: "#F8FAFB",
        "text-primary": "#1A202C",
        "text-secondary": "#718096",
        success: "#38A169",
        warning: "#D97706",
        border: "#E2E8F0",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

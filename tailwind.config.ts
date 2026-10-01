import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        canvas: "#f7f8f5",
        moss: { 50: "#eef6ec", 100: "#dcefd8", 500: "#5d8e59", 600: "#477648", 700: "#355d39" },
        coral: { 50: "#fff1ec", 400: "#ef8868", 500: "#dc6d4c" },
        gold: { 50: "#fff8e4", 400: "#e5b64f" }
      },
      boxShadow: { soft: "0 12px 32px rgb(36 54 42 / 0.08)" }
    }
  },
  plugins: []
};

export default config;

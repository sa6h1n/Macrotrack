import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17191d",
        canvas: "#f5f6f8",

        moss: {
          50: "#f0eeff",
          100: "#e4e0ff",
          500: "#8170e6",
          600: "#6957d8",
          700: "#5f4ec7",
        },

        coral: {
          50: "#fff1f1",
          400: "#ef7777",
          500: "#d94c4c",
        },

        gold: {
          50: "#fff8e4",
          400: "#e5b64f",
        },
      },

      boxShadow: {
        soft: "0 12px 32px rgb(23 25 29 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
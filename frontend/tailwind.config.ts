import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slateInk: "#020617",
        panel: "#0f172a",
        panelSoft: "#1e293b",
        accent: "#22c55e",
      },
    },
  },
  plugins: [],
};

export default config;
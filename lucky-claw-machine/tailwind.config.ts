import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cabinet: {
          bg: "#0a0518",
          panel: "#150a2e",
          metal: "#2a1d4a",
        },
        neon: {
          pink: "#ff2e9a",
          cyan: "#2ee6ff",
          purple: "#a855ff",
          yellow: "#ffe62e",
          green: "#39ff8a",
          orange: "#ff8c2e",
        },
        rarity: {
          common: "#9ca3af",
          rare: "#2ee6ff",
          epic: "#a855ff",
          legendary: "#ffcb2e",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        "neon-pink": "0 0 5px #ff2e9a, 0 0 20px #ff2e9a, 0 0 40px #ff2e9a55",
        "neon-cyan": "0 0 5px #2ee6ff, 0 0 20px #2ee6ff, 0 0 40px #2ee6ff55",
        "neon-purple": "0 0 5px #a855ff, 0 0 20px #a855ff, 0 0 40px #a855ff55",
        "neon-yellow": "0 0 5px #ffe62e, 0 0 20px #ffe62e, 0 0 40px #ffe62e55",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
          "52%": { opacity: "0.4" },
          "54%": { opacity: "0.9" },
        },
        marquee: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "200px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-6px) rotate(3deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        flicker: "flicker 3.5s infinite",
        marquee: "marquee 4s linear infinite",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

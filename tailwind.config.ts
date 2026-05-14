import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          deep: "#0a2a2a",
          mid: "#0d3d3d",
          teal: "#1a5c5c",
          light: "#2d8a8a",
          bright: "#3aafa9",
        },
        sand: {
          DEFAULT: "#c8a96e",
          light: "#e8d5a3",
          dark: "#a07840",
        },
        cream: "#f5f0e8",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        // Container utama lebih sempit supaya ada ruang di kiri kanan
        "site": "1200px",
      },
      padding: {
        // Padding horizontal standar
        "site": "clamp(1.5rem, 6vw, 5rem)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, rgba(10,42,42,0.85) 0%, rgba(10,42,42,0.4) 50%, rgba(10,42,42,0.2) 100%)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.8s ease forwards",
        shimmer: "shimmer 3s ease infinite",
        wave: "wave 4s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        wave: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

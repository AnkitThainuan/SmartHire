/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#131A2B",       // primary text / dark surfaces
        paper: "#F3F4F7",     // light background (cool, not the cream cliché)
        signal: "#3D5AFE",    // primary action / brand
        momentum: "#00C2A8",  // success / high readiness
        alert: "#FF6B4A",     // warnings / low scores
        mist: "#DDE1EA",      // borders / dividers
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

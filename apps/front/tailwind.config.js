/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        github: {
          bg: "#0d1117",
          border: "#30363d",
          text: "#f0f6fc",
          muted: "#7d8590",
          accent: "#238636",
          blue: "#1f6feb",
        },
      },
    },
  },
  plugins: [],
};